
# CRM Integration System for VoiceHub

## Overview

This plan outlines a comprehensive CRM integration system for Jobber, ServiceTitan, and House Call Pro. The integration will enable bidirectional sync: pushing communications from VoiceHub to CRMs, receiving webhooks from CRMs to manage campaign enrollments, and accessing scheduling/dispatch capabilities.

## Architecture Diagram

```text
+------------------+     +------------------+     +------------------+
|    Jobber API    |     | ServiceTitan API |     | HouseCall Pro API|
|    (GraphQL)     |     |     (REST)       |     |     (REST)       |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         +------------------------+------------------------+
                                  |
                    +-------------v--------------+
                    |   CRM Integration Layer    |
                    |   (Supabase Edge Function) |
                    +-------------+--------------+
                                  |
         +------------------------+------------------------+
         |                        |                        |
+--------v---------+    +---------v--------+    +---------v--------+
| crm-sync         |    | crm-webhook      |    | crm-scheduling   |
| (Push to CRM)    |    | (Receive events) |    | (Availability)   |
+------------------+    +------------------+    +------------------+
         |                        |                        |
         +------------------------+------------------------+
                                  |
                    +-------------v--------------+
                    |     VoiceHub Database      |
                    |  (contacts, campaigns,     |
                    |   sms_messages, call_logs) |
                    +----------------------------+
```

## Database Schema

### New Tables

**1. `crm_connections`** - Stores OAuth credentials per user/CRM
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to auth.users |
| crm_type | text | 'jobber', 'servicetitan', 'housecall_pro' |
| access_token | text | Encrypted OAuth access token |
| refresh_token | text | Encrypted OAuth refresh token |
| expires_at | timestamptz | Token expiration time |
| tenant_id | text | CRM-specific tenant/account ID |
| is_active | boolean | Connection status |
| sync_settings | jsonb | Per-CRM sync preferences |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**2. `crm_sync_logs`** - Audit trail for all sync operations
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key |
| crm_connection_id | uuid | Foreign key to crm_connections |
| sync_type | text | 'communication', 'contact', 'appointment' |
| direction | text | 'push' or 'pull' |
| entity_type | text | 'sms_message', 'call_log', 'contact' |
| entity_id | uuid | Reference to synced entity |
| crm_entity_id | text | ID in the CRM system |
| status | text | 'success', 'failed', 'pending' |
| error_message | text | |
| payload | jsonb | Sync payload for debugging |
| created_at | timestamptz | |

**3. `crm_contact_mappings`** - Links VoiceHub contacts to CRM customers
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key |
| contact_id | uuid | Foreign key to contacts |
| crm_connection_id | uuid | Foreign key to crm_connections |
| crm_customer_id | text | Customer ID in CRM |
| crm_customer_data | jsonb | Cached customer data |
| last_synced_at | timestamptz | |
| created_at | timestamptz | |

**4. `crm_scheduling_config`** - Business units, job types, and scheduling rules
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key |
| crm_connection_id | uuid | Foreign key to crm_connections |
| business_units | jsonb | Cached list of business units |
| job_types | jsonb | Cached list of job types |
| technicians | jsonb | Cached list of technicians |
| scheduling_rules | jsonb | Availability windows, buffer times |
| last_synced_at | timestamptz | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**5. `crm_webhook_secrets`** - Webhook authentication per CRM
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key |
| crm_type | text | 'jobber', 'servicetitan', 'housecall_pro' |
| secret_key | text | Webhook verification secret |
| is_active | boolean | |
| created_at | timestamptz | |

## Edge Functions

### 1. `crm-oauth` - OAuth Flow Handler
Handles OAuth 2.0 authorization for all three CRMs:
- Initiate authorization redirect
- Handle callback and token exchange
- Token refresh on expiration
- Store encrypted tokens

### 2. `crm-sync` - Push Communications to CRM
Syncs VoiceHub data to CRM:
- Push SMS messages as customer notes/communications
- Push call logs with transcripts
- Create/update customers on contact creation
- Map VoiceHub contacts to CRM customers

### 3. `crm-webhook` - Receive CRM Events
Handles incoming webhooks from CRMs:
- Customer status changes (e.g., marked as contacted)
- Job booked/scheduled events
- Appointment completed events
- Triggers campaign removal when customer is "handled"

### 4. `crm-scheduling` - Scheduling Integration
Fetches and manages scheduling data:
- Get available time slots
- Fetch business units and job types
- Check technician availability
- Book appointments directly to dispatch board

## Frontend Components

### 1. CRM Integrations Page (`/dashboard/agents/integrations`)
A new page under Deploy section with:
- CRM connection cards (Jobber, ServiceTitan, HouseCall Pro)
- OAuth connect/disconnect flows
- Connection status and last sync time
- Sync settings toggle (auto-sync, bidirectional, etc.)

### 2. CRM Settings Component
Per-CRM configuration:
- Enable/disable communication sync
- Select which data to sync (SMS, calls, both)
- Configure webhook triggers for campaign removal
- Map job types to VoiceHub services

### 3. Scheduling Configuration Panel
- Business unit selector
- Job type mapping
- Availability preview calendar
- Scheduling rules editor

### 4. Contact CRM Link
On contact detail page:
- Show linked CRM customer
- Manual sync button
- View CRM activity
- Link/unlink customer

## CRM-Specific Implementation Details

### Jobber (GraphQL API)
- **Auth**: OAuth 2.0 with refresh tokens
- **Webhooks**: CLIENT_CREATE, CLIENT_UPDATE, JOB_CREATE, JOB_COMPLETE
- **Endpoints**: GraphQL at `api.getjobber.com/api/graphql`
- **Scheduling**: Query jobs and appointments, create jobs via mutation

### ServiceTitan (REST API)
- **Auth**: OAuth 2.0 Client Credentials flow
- **Webhooks**: Custom webhook subscriptions
- **Endpoints**: REST at `api.servicetitan.io/`
- **Scheduling Pro**: Native scheduling API with availability slots
- **Tenant ID**: Required for all API calls

### HouseCall Pro (REST API)
- **Auth**: OAuth 2.0
- **Webhooks**: job.created, job.completed, customer.updated
- **Endpoints**: REST at `api.housecallpro.com/`
- **Scheduling**: Jobs and schedule endpoints

## Sync Logic Workflows

### Push Communication to CRM (Triggered by SMS/Call)
```text
1. SMS sent or call completed
2. Check if user has active CRM connection
3. Look up contact's CRM customer mapping
4. If no mapping, attempt to match by phone number
5. Push communication as customer note/activity
6. Log sync result
```

### CRM Webhook → Campaign Removal
```text
1. Receive webhook from CRM (e.g., job booked)
2. Verify webhook signature
3. Extract customer phone/ID
4. Find VoiceHub contact by phone or CRM mapping
5. Find active campaign enrollments for contact
6. Update enrollment status to 'cancelled_crm_event'
7. Optionally end conversation
8. Log the action
```

### Scheduling Flow
```text
1. AI agent collects service details from lead
2. Fetch available slots from CRM (with caching)
3. Present options to lead
4. Lead selects preferred time
5. Create job/appointment in CRM dispatch board
6. Update contact status in VoiceHub
7. Send confirmation to lead
```

## File Structure

```text
src/
├── components/
│   └── integrations/
│       ├── CrmConnectionCard.tsx
│       ├── CrmSyncSettings.tsx
│       ├── CrmSchedulingConfig.tsx
│       ├── JobberConnector.tsx
│       ├── ServiceTitanConnector.tsx
│       └── HouseCallProConnector.tsx
├── hooks/
│   ├── useCrmConnections.ts
│   ├── useCrmSync.ts
│   └── useCrmScheduling.ts
├── pages/
│   └── agents/
│       └── CrmIntegrations.tsx
└── lib/
    └── crm/
        ├── types.ts
        └── constants.ts

supabase/functions/
├── crm-oauth/
│   └── index.ts
├── crm-sync/
│   └── index.ts
├── crm-webhook/
│   └── index.ts
└── crm-scheduling/
    └── index.ts
```

## Implementation Phases

### Phase 1: Foundation
- Create database tables with migrations
- Build `crm-oauth` edge function for OAuth flows
- Create `CrmIntegrations` page with connection cards
- Implement `useCrmConnections` hook
- Add navigation item under "Deploy"

### Phase 2: Communication Sync (Push)
- Build `crm-sync` edge function
- Add triggers on `sms_messages` and `call_logs` INSERT
- Create sync logging and error handling
- Add sync status indicators on contacts

### Phase 3: CRM Webhooks (Pull)
- Build `crm-webhook` edge function with signature verification
- Define webhook event handlers per CRM
- Implement campaign removal logic
- Add webhook activity log UI

### Phase 4: Scheduling Integration
- Build `crm-scheduling` edge function
- Create scheduling config UI
- Cache business units and job types
- Integrate availability check into AI agent prompts
- Enable direct booking via agent conversations

## Security Considerations

- All OAuth tokens stored encrypted at rest
- Webhook signatures verified before processing
- Per-user API key isolation
- RLS policies on all CRM tables
- Audit logging for all sync operations

## Technical Notes

- Token refresh handled automatically before expiration
- Retry logic with exponential backoff for sync failures
- Caching layer for scheduling data (15-minute TTL)
- Rate limiting awareness for each CRM's API limits
