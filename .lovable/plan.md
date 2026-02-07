
# Testing Plan: SMS Campaign Automation System

## Current State Summary

After thorough investigation, I've tested both critical workflows and identified key findings:

### What's Working
1. **Lead Webhook (`lead-webhook`)** - Contact creation and conversation linking works correctly
   - Tested with: `POST /lead-webhook` with Angi source
   - Result: Contact created (`a82223cc-...`), conversation created (`a0ed489e-...`)
   - Issue: Campaign enrollment requires campaigns to be **active** (`is_active: true`)

2. **SMS Inbound (`sms-inbound`)** - Message recording and response flow works
   - Tested with: `POST /sms-inbound` simulating customer reply
   - Result: Message recorded, agent response generated
   - Issue: AI response failing due to incorrect API endpoint

### Issues Found

| Issue | Root Cause | Status |
|-------|------------|--------|
| No campaign enrollments | Campaigns have `is_active: false` | Configuration issue |
| AI fallback response | Wrong Lovable AI endpoint URL | Code fix needed |

---

## Proposed Testing Strategy

### Phase 1: Fix AI Integration

The `sms-inbound` function uses an incorrect endpoint:

**Current (broken):**
```text
https://ai.lovable.dev/api/v2/completions
```

**Correct endpoint:**
```text
https://ai.gateway.lovable.dev/v1/chat/completions
```

This fix will enable the AI agent to generate dynamic responses.

---

### Phase 2: End-to-End Test Procedure

Once the code fix is applied, here's how to test the full flow:

#### Test 1: Contact Creation + Campaign Enrollment

**Prerequisites:**
- Activate a campaign with lead sources set (e.g., "angi")
- Ensure campaign has at least one step with delay = 0 for immediate message

**Test Steps:**
1. Send POST to `/lead-webhook`:
```json
{
  "source": "angi",
  "phone": "5559876543",
  "name": "Jane Doe",
  "service": "Plumbing Repair"
}
```
Headers: `x-webhook-secret: test-secret-123`

2. Verify in database:
   - Contact created in `contacts` table
   - Conversation created in `sms_conversations`
   - Enrollment created in `sms_campaign_enrollments`
   - Initial message sent in `sms_messages`

---

#### Test 2: Inbound SMS + AI Agent Response

**Test Steps:**
1. Send POST to `/sms-inbound`:
```json
{
  "from": "+15559876543",
  "to": "+18001234567",
  "body": "What are your hours?"
}
```

2. Verify:
   - Inbound message recorded in `sms_messages`
   - AI-generated response recorded
   - Campaign enrollment paused (if active)

---

#### Test 3: Campaign Step Progression

**Test Steps:**
1. Manually call `/sms-processor`
2. Verify enrollments with `next_message_at <= now()` are processed
3. Check message delivery and step advancement

---

## Technical Changes Required

### 1. Update sms-inbound AI endpoint

```text
File: supabase/functions/sms-inbound/index.ts
Line 46: Change URL from 'https://ai.lovable.dev/api/v2/completions'
         to 'https://ai.gateway.lovable.dev/v1/chat/completions'
```

### 2. Add UI to manage campaign active status
Ensure the Campaigns page allows toggling `is_active` so campaigns can be activated for testing

### 3. Add UI to display/manage webhook secret
Users need to see their webhook secret in Settings to configure external integrations

---

## Verification Checklist

After implementation:

- [ ] AI responses generated dynamically (not fallback)
- [ ] Contacts created via webhook appear in Contacts page
- [ ] Campaign enrollments visible in database
- [ ] SMS messages logged in conversation history
- [ ] Campaign pauses when customer replies
- [ ] Escalation keywords trigger proper handoff

---

## Database Queries for Manual Verification

```sql
-- Check recent contacts
SELECT * FROM contacts ORDER BY created_at DESC LIMIT 5;

-- Check enrollments
SELECT e.*, c.name as campaign_name 
FROM sms_campaign_enrollments e
JOIN sms_campaigns c ON e.campaign_id = c.id
ORDER BY e.created_at DESC;

-- Check messages in a conversation
SELECT * FROM sms_messages 
WHERE conversation_id = 'your-conversation-id'
ORDER BY created_at;
```
