
# Plan: Automated SMS Campaign Enrollment and AI Agent Response System

## Overview
This plan implements a complete automation flow where incoming leads from webhooks are automatically enrolled into matching SMS campaigns, receive the first message immediately per campaign timing rules, and trigger the SMS Agent to handle the conversation when the lead responds.

---

## Architecture Summary

```text
+----------------+     +------------------+     +-------------------+
|  Lead Webhook  | --> | lead-webhook     | --> | Create Contact +  |
|  (Angi, etc.)  |     | Edge Function    |     | sms_conversation  |
+----------------+     +------------------+     +-------------------+
                                                        |
                                                        v
                              +---------------------------+
                              | Enroll in matching        |
                              | campaigns (lead_sources)  |
                              +---------------------------+
                                        |
                                        v
                        +-------------------------------+
                        | Send first campaign message   |
                        | (via sms-processor function)  |
                        +-------------------------------+

+------------------+     +------------------+     +-------------------+
| Lead Responds    | --> | sms-inbound      | --> | Deploy SMS Agent  |
| (Twilio/etc.)    |     | Edge Function    |     | for AI response   |
+------------------+     +------------------+     +-------------------+
                                                        |
                                                        v
                              +---------------------------+
                              | Call Lovable AI to        |
                              | generate agent response   |
                              +---------------------------+

+-----------------+     +------------------+
| pg_cron (5 min) | --> | sms-processor    |
+-----------------+     | Edge Function    |
                        +------------------+
                                |
                                v
                  +----------------------------+
                  | Process pending campaign   |
                  | steps (next_message_at)    |
                  +----------------------------+
```

---

## Implementation Steps

### Phase 1: Database Updates

**1.1 Add contacts table (if not exists with proper structure)**
- Ensure `contacts` table links to `sms_conversations`
- Add `campaign_enrollment_id` field for tracking

**1.2 Update sms_campaigns table**
- Confirm `lead_sources` array is working (e.g., `['angi', 'thumbtack']`)
- Confirm `trigger_type` supports values: `'new_lead'`, `'manual'`, `'no_response'`

**1.3 Enable required extensions**
- Enable `pg_cron` for scheduled message processing
- Enable `pg_net` for HTTP calls from database

---

### Phase 2: Edge Functions

**2.1 Create `lead-webhook` Edge Function**
- Accepts POST requests with secret-based authentication
- Validates payload (source, phone, name, service)
- Creates a new `contact` record
- Creates an `sms_conversation` linked to the user's default SMS agent
- Finds matching active campaigns where `lead_sources` contains the source
- Creates `sms_campaign_enrollment` record for each matching campaign
- Triggers immediate first step message if delay is 0
- Returns success with contact and conversation IDs

**2.2 Create `sms-processor` Edge Function**
- Queries `sms_campaign_enrollments` where `next_message_at <= now()` and `status = 'active'`
- For each enrollment:
  - Fetches the campaign step at `current_step_order`
  - Renders the message template with lead variables
  - Records the message in `sms_messages`
  - Updates enrollment: increment step, calculate next `next_message_at`
  - If no more steps, mark enrollment as `'completed'`
- Uses Twilio or similar provider to send actual SMS (configurable)
- Logs all activity for debugging

**2.3 Create `sms-inbound` Edge Function**
- Receives incoming SMS from Twilio/provider webhook
- Matches phone number to existing `sms_conversation`
- Records the inbound message in `sms_messages`
- Pauses any active campaign enrollments for this conversation (mark as `'paused_by_reply'`)
- Fetches the linked `sms_agent` configuration
- Calls Lovable AI with:
  - Agent's system prompt
  - Conversation history from `sms_messages`
  - Lead context (name, service, source)
- Generates AI response
- Sends response via SMS provider
- Records outbound message in `sms_messages`

---

### Phase 3: SMS Provider Integration

**3.1 Add Twilio Configuration**
- Request secrets: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- Create helper functions for sending SMS
- Implement Twilio webhook signature verification for inbound

---

### Phase 4: Scheduled Processing

**4.1 Set up pg_cron job**
- Schedule `sms-processor` to run every 5 minutes
- Use `pg_net` to call the edge function with proper auth

---

### Phase 5: Frontend Updates

**5.1 Update `useSmsCampaigns` hook**
- Migrate from `/api/*` routes to direct Supabase queries
- Add `lead_sources` and `trigger_type` fields to campaign creation/update

**5.2 Update Campaigns page**
- Add UI for configuring `lead_sources` (multi-select: Angi, Thumbtack, Google LSA, etc.)
- Add UI for `trigger_type` selection
- Show enrollment count and status

**5.3 Update Contacts page**
- Display campaign enrollment status per contact
- Link to conversation history

**5.4 Create Chat History page**
- Display `sms_conversations` with full message history
- Show agent responses vs lead messages
- Display escalation status and sentiment

---

## Technical Details

### Lead Webhook Payload Structure
```json
{
  "source": "angi",
  "phone": "+15551234567",
  "name": "John Smith",
  "email": "john@example.com",
  "service": "Plumbing Repair",
  "address": "123 Main St",
  "notes": "Water heater issue"
}
```

### Campaign Enrollment Flow
1. Webhook creates contact + conversation
2. Query: `SELECT * FROM sms_campaigns WHERE is_active = true AND 'angi' = ANY(lead_sources)`
3. For each match: Create enrollment with `current_step_order = 1`
4. Calculate `next_message_at = now() + step.delay_minutes * interval '1 minute'`
5. If delay is 0, immediately send first message

### Agent Response Flow
1. Inbound SMS triggers function
2. Pause all active enrollments for this conversation
3. Load agent prompt + conversation history
4. Call Lovable AI (`google/gemini-2.5-flash` for speed)
5. Send AI-generated response
6. Continue AI conversation until escalation or resolution

### Message Template Variables
- `{{first_name}}` - Lead's first name
- `{{business_name}}` - User's business name
- `{{service_category}}` - Requested service
- `{{agent_name}}` - SMS agent name
- `{{lead_source}}` - Where the lead came from

---

## Files to Create/Modify

### New Files
- `supabase/functions/lead-webhook/index.ts`
- `supabase/functions/sms-processor/index.ts`
- `supabase/functions/sms-inbound/index.ts`

### Modified Files
- `src/hooks/useSmsCampaigns.ts` - Migrate to Supabase client
- `src/hooks/useContacts.ts` - Enable with real queries
- `src/pages/agents/Campaigns.tsx` - Add lead sources config
- `src/pages/agents/Contacts.tsx` - Show enrollment status
- `src/pages/agents/ChatHistory.tsx` - Display conversations

### Database Migrations
- Add `contact_id` column to `sms_conversations`
- Add any missing indexes for performance
- Create pg_cron job for scheduled processing

---

## Required Secrets
Before implementation, these secrets will be needed:
1. **TWILIO_ACCOUNT_SID** - Twilio account identifier
2. **TWILIO_AUTH_TOKEN** - Twilio authentication token
3. **TWILIO_PHONE_NUMBER** - Phone number for sending SMS

---

## Success Criteria
1. Leads from webhooks automatically appear in Contacts
2. Matching campaigns enroll leads and send first message
3. Lead replies trigger AI agent responses
4. Campaign pauses when lead engages with agent
5. Full conversation history visible in Chat History
6. Scheduled messages send at configured intervals
