
# Plan: Automated SMS Campaign Enrollment and AI Agent Response System

## Status: ✅ Phase 1-2 Complete

---

## Completed Tasks

### ✅ Phase 1: Database Updates
- Created `contacts` table with RLS policies
- Added `contact_id` column to `sms_conversations`
- Enabled `pg_cron` and `pg_net` extensions
- Created indexes for performance

### ✅ Phase 2: Edge Functions
- **lead-webhook**: Handles incoming leads, creates contacts, enrolls in campaigns
- **sms-processor**: Processes scheduled campaign messages
- **sms-inbound**: Handles inbound SMS, pauses campaigns, triggers AI agent

### ✅ Phase 5: Frontend Updates
- Migrated `useSmsCampaigns` hook to direct Supabase queries
- Migrated `useContacts` hook to direct Supabase queries
- Fixed type compatibility for CampaignStep (delay_days/delay_hours)

---

## Remaining Tasks

### 🔲 Phase 3: Retell SMS Integration
- Integrate with Retell API for actual SMS sending
- The edge functions currently log messages but don't send via Retell yet
- Need to research Retell's SMS API endpoints

### 🔲 Phase 4: Scheduled Processing
- Set up pg_cron job to call sms-processor every 5 minutes
- Requires running SQL insert (not migration) to create cron job

### 🔲 Additional Frontend Updates
- Add lead_sources multi-select UI to Campaigns page
- Add trigger_type selection to Campaigns page
- Enhance Contacts page with enrollment status
- Build Chat History page for viewing conversations

---

## Architecture

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
| (Retell webhook) |     | Edge Function    |     | for AI response   |
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
```

---

## Webhook Usage

### Lead Webhook Endpoint
```
POST https://zscmunbouhmwouiczkgk.supabase.co/functions/v1/lead-webhook
```

**Headers:**
- `x-webhook-secret`: User's webhook secret from user_settings
- `Content-Type: application/json`

**Payload:**
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

### SMS Inbound Endpoint
```
POST https://zscmunbouhmwouiczkgk.supabase.co/functions/v1/sms-inbound
```

**Payload (from Retell/SMS provider):**
```json
{
  "from": "+15551234567",
  "to": "+15559876543",
  "body": "Yes, I'd like to schedule an appointment"
}
```

---

## Template Variables
- `{{first_name}}` - Lead's first name
- `{{business_name}}` - User's business name
- `{{service_category}}` - Requested service
- `{{agent_name}}` - SMS agent name
- `{{lead_source}}` - Where the lead came from
