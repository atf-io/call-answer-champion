
# Testing Plan: SMS Campaign Automation System

## Current State Summary

### ✅ Issues Fixed

| Issue | Root Cause | Status |
|-------|------------|--------|
| AI fallback response | Wrong Lovable AI endpoint URL | ✅ **FIXED** |
| No campaign enrollments | Campaigns have `is_active: false` | ✅ **UI Added** (toggle on Campaigns detail page) |
| Webhook secret not visible | Not displayed in Settings | ✅ **UI Added** |

---

## Technical Changes Made

### 1. Fixed AI endpoint in sms-inbound (✅ Complete)
```
File: supabase/functions/sms-inbound/index.ts
Changed: https://ai.lovable.dev/api/v2/completions
To: https://ai.gateway.lovable.dev/v1/chat/completions
```

### 2. Campaign Active Toggle (✅ Already Exists)
The Campaigns detail page already has a Switch component to toggle `is_active`:
- Located at line 303-310 in `src/pages/agents/Campaigns.tsx`
- Shows "Active" / "Inactive" status
- Calls `handleToggleActive()` to update the campaign

### 3. Webhook Secret in Settings (✅ Complete)
Added a new "Lead Webhook" section to `src/pages/Settings.tsx`:
- Displays the webhook URL for lead integrations
- Shows/generates/copies the webhook secret
- Includes instructions for configuring external integrations

---

## End-to-End Test Procedure

### Test 1: Contact Creation + Campaign Enrollment

**Prerequisites:**
1. Go to Campaigns page, create or select a campaign
2. Enable the campaign using the Active toggle switch
3. Set lead sources (e.g., "angi") in campaign settings
4. Ensure campaign has at least one step with delay = 0 for immediate message

**Test Steps:**
1. Go to Settings → Lead Webhook section
2. Copy the Webhook URL and Secret
3. Send POST request:
```bash
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: YOUR_SECRET" \
  -d '{"source": "angi", "phone": "5559876543", "name": "Jane Doe", "service": "Plumbing Repair"}'
```

4. Verify in database:
   - Contact created in `contacts` table
   - Conversation created in `sms_conversations`
   - Enrollment created in `sms_campaign_enrollments`

---

### Test 2: Inbound SMS + AI Agent Response

**Test Steps:**
1. With an active conversation, send POST to `/sms-inbound`:
```json
{
  "from": "+15559876543",
  "to": "+18001234567",
  "body": "What are your hours?"
}
```

2. Verify:
   - Inbound message recorded in `sms_messages`
   - AI-generated response recorded (not fallback)
   - Campaign enrollment paused if active

---

## Verification Checklist

- [x] AI endpoint fixed to use correct Lovable gateway
- [x] Campaign active toggle exists in UI
- [x] Webhook secret visible in Settings
- [ ] AI responses generated dynamically (test with active conversation)
- [ ] Contacts created via webhook appear in Contacts page
- [ ] Campaign enrollments work when campaign is active

---

## Database Queries for Manual Verification

```sql
-- Check recent contacts
SELECT * FROM contacts ORDER BY created_at DESC LIMIT 5;

-- Check enrollments (should appear when campaign is_active = true)
SELECT e.*, c.name as campaign_name 
FROM sms_campaign_enrollments e
JOIN sms_campaigns c ON e.campaign_id = c.id
ORDER BY e.created_at DESC;

-- Check messages in a conversation
SELECT * FROM sms_messages 
WHERE conversation_id = 'your-conversation-id'
ORDER BY created_at;

-- Check if campaigns are active
SELECT id, name, is_active, lead_sources FROM sms_campaigns;
```
