
# SMS Lead Automation Flow - Validation & Reliability Plan

## Current State Analysis

After exploring the codebase, I've identified that you have most of the infrastructure in place, but there are **critical gaps** that prevent the flow from being seamless and 100% reliable.

---

## Flow Overview

```text
Lead Webhook    Campaign Enrollment    Scheduled Messages    Inbound Reply    Agent Takeover    Result Assignment
     |                  |                      |                   |                 |                  |
     v                  v                      v                   v                 v                  v
[lead-webhook] --> [Enroll + Send Msg 1] --> [sms-processor] --> [sms-inbound] --> [AI Response] --> [Conversation End]
     |                  |                      |                   |                 |                  |
     +--> Contact       +--> Conversation      +--> Runs on cron   +--> Pauses       +--> Agent uses    +--> conversion_status
     +--> SMS Agent     +--> Enrollment        |    (MISSING!)     |   campaign      |   its prompt     |   (NOT IMPLEMENTED)
                        +--> First SMS         |                   |                 |                  |
                                               +--> Sends follow-ups                 |                  |
```

---

## Issues Identified

### 1. **CRITICAL: Scheduled SMS Processor Not Running**
The `sms-processor` edge function exists but is **never called**. There's no cron job configured to run it every 5 minutes.

**Evidence:**
- Database shows enrollments with `next_message_at` timestamps from Feb 7th that haven't been processed
- The migration enables `pg_cron` extension but never creates the actual job
- No `cron.job` entries exist in the database

**Fix Required:**
- Create a pg_cron job to call the sms-processor edge function every 5 minutes
- Alternatively, use Supabase's built-in edge function scheduling

### 2. **CRITICAL: Retell Inbound SMS Webhook Not Configured**
The `sms-inbound` edge function exists but Retell doesn't know to call it when an SMS reply comes in.

**Current State:**
- The function expects a POST with `{ from, to, body }` payload
- Retell requires you to configure an "Inbound Webhook" URL in the dashboard

**Fix Required:**
- Document/configure the Retell dashboard inbound webhook URL
- Update the payload format to match Retell's actual webhook format (uses `sms_inbound` event)

### 3. **MISSING: Conversation Result Assignment**
When a conversation ends, there's no logic to analyze the conversation and assign a `conversion_status` result.

**Current State:**
- `sms_conversations` has a `conversion_status` column (text)
- No code ever sets this value
- No AI analysis of conversation outcomes

**Required Values:**
- `success` - Appointment booked / Goal achieved
- `qualified` - Lead qualified but no appointment
- `unqualified` - Lead not a good fit
- `escalated` - Handed off to human
- `no_response` - Lead never replied
- `discarded` - Lead opted out or irrelevant

### 4. **MISSING: Campaign-to-Agent Association Enforcement**
Campaigns can specify an `sms_agent_id`, but when a lead replies, the system uses the conversation's agent, not the campaign's agent.

**Current State:** Working correctly - the conversation stores `sms_agent_id` which is the agent that handles replies.

### 5. **MINOR: No Conversation End Detection**
There's no logic to detect when a conversation should end naturally (goal achieved, timeout, etc.) and trigger result assignment.

---

## Implementation Plan

### Phase 1: Enable Scheduled Message Processing (Critical)

**1.1 Create pg_cron Job**
Add a database migration to schedule the sms-processor to run every 5 minutes:

```sql
SELECT cron.schedule(
  'process-sms-campaigns',
  '*/5 * * * *',
  $$
  SELECT extensions.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/sms-processor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  )
  $$
);
```

**1.2 Alternative: Use pg_net for simpler HTTP calls**
The cron job will use pg_net extension (already enabled) to call the edge function.

### Phase 2: Fix Inbound SMS Webhook (Critical)

**2.1 Update sms-inbound to Handle Retell's Format**
Retell sends a different payload structure than what we currently expect:

```typescript
interface RetellSmsInboundPayload {
  event: "sms_inbound";
  sms_inbound: {
    from_number: string;
    to_number: string;
    message: string;
    agent_id?: string;
  };
}
```

**2.2 Add Configuration Instructions**
In Retell Dashboard: Phone Numbers > Select Number > Inbound Webhook URL:
```
https://zscmunbouhmwouiczkgk.supabase.co/functions/v1/sms-inbound
```

### Phase 3: Implement Result Assignment

**3.1 Create Conversation Analysis Function**
Add AI-powered conversation analysis when conversations end:

```typescript
async function analyzeConversationResult(
  messages: SmsMessage[],
  agentPrompt: string
): Promise<ConversationResult> {
  // Call Lovable AI to analyze the conversation
  // Returns: success, qualified, unqualified, escalated, no_response, discarded
}
```

**3.2 Add Auto-End Detection**
Detect conversation end triggers:
- Lead says "stop" or opts out -> `discarded`
- Appointment scheduled -> `success`
- Lead escalated -> `escalated`
- No response for X days -> `no_response`
- Lead disqualified by agent -> `unqualified`

**3.3 Update Conversation Status on End**
When conversation ends, update `sms_conversations.conversion_status` and `ended_at`.

### Phase 4: Reliability Improvements

**4.1 Add Dead Letter Handling**
Track failed SMS deliveries and retry logic:
- Add `delivery_status` column to `sms_messages`
- Implement retry logic for failed deliveries

**4.2 Add Monitoring & Alerts**
- Log all critical events with structured logging
- Create alert rules for failed SMS deliveries
- Create alert for processor not running

**4.3 Add Idempotency**
- Prevent duplicate enrollments for same phone + campaign
- Prevent duplicate message sends

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/XXXX_add_cron_job.sql` | Create | Schedule sms-processor every 5 min |
| `supabase/functions/sms-inbound/index.ts` | Modify | Support Retell's webhook format |
| `supabase/functions/sms-processor/index.ts` | Modify | Add result analysis on completion |
| `supabase/functions/conversation-analyzer/index.ts` | Create | AI-powered result classification |
| `supabase/migrations/XXXX_add_delivery_tracking.sql` | Create | Add delivery_status to sms_messages |

---

## Testing Strategy

1. **Test lead-webhook**: Simulate incoming lead, verify enrollment and first SMS
2. **Test sms-processor**: Manually trigger and verify follow-up messages sent
3. **Test sms-inbound**: Simulate Retell webhook, verify campaign pauses and agent responds
4. **Test result assignment**: Verify conversations get correct status after ending
5. **End-to-end test**: Full flow from lead ingestion to conversation completion

---

## Technical Details

### Database Changes Required

```sql
-- Add delivery tracking
ALTER TABLE sms_messages ADD COLUMN delivery_status TEXT DEFAULT 'pending';
ALTER TABLE sms_messages ADD COLUMN delivery_error TEXT;
ALTER TABLE sms_messages ADD COLUMN delivered_at TIMESTAMPTZ;

-- Add unique constraint to prevent duplicate enrollments
ALTER TABLE sms_campaign_enrollments 
ADD CONSTRAINT unique_phone_campaign UNIQUE (lead_phone, campaign_id);
```

### Cron Job Setup
The pg_cron extension is already enabled. We need to:
1. Set the required secrets as database settings
2. Create the cron job to call sms-processor

### Edge Function Updates
- `sms-inbound`: Parse Retell's format, improve AI response quality
- `sms-processor`: Add logging, better error handling
- New `conversation-analyzer`: AI classification of outcomes

---

## Priority Order

1. **P0 (Do First)**: Enable cron job for sms-processor - without this, campaigns never progress
2. **P0 (Do First)**: Fix sms-inbound to match Retell's format - without this, replies aren't processed
3. **P1 (Next)**: Implement result assignment - needed for tracking success
4. **P2 (Later)**: Add reliability improvements - monitoring, retries, alerts

