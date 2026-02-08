import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.224.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-jobber-signature, x-servicetitan-signature, x-hcp-signature',
};

type CrmType = 'jobber' | 'servicetitan' | 'housecall_pro';

interface WebhookEvent {
  crm_type: CrmType;
  event_type: string;
  customer_phone?: string;
  customer_id?: string;
  job_id?: string;
  payload: Record<string, unknown>;
}

// Verify Jobber webhook signature
async function verifyJobberSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
    return computed === signature;
  } catch (error) {
    console.error('Jobber signature verification failed:', error);
    return false;
  }
}

// Verify ServiceTitan webhook signature
async function verifyServiceTitanSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    return computed === signature;
  } catch (error) {
    console.error('ServiceTitan signature verification failed:', error);
    return false;
  }
}

// Verify HouseCall Pro webhook signature
async function verifyHouseCallProSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const computed = 'sha256=' + Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    return computed === signature;
  } catch (error) {
    console.error('HouseCall Pro signature verification failed:', error);
    return false;
  }
}

// Extract phone number from different CRM payloads
function extractPhoneFromPayload(crmType: CrmType, payload: Record<string, unknown>): string | null {
  try {
    switch (crmType) {
      case 'jobber': {
        // Jobber sends customer data in webHookEvent.data
        const data = payload.webHookEvent as Record<string, unknown> | undefined;
        const customer = data?.data as Record<string, unknown> | undefined;
        return (customer?.phone as string) || (customer?.mobilePhone as string) || null;
      }
      case 'servicetitan': {
        // ServiceTitan sends customer in the root
        const customer = payload.customer as Record<string, unknown> | undefined;
        const phones = customer?.phoneSettings as Array<{ phoneNumber: string }> | undefined;
        return phones?.[0]?.phoneNumber || null;
      }
      case 'housecall_pro': {
        // HouseCall Pro sends customer data directly
        const customer = payload.customer as Record<string, unknown> | undefined;
        return (customer?.mobile_number as string) || (customer?.phone_number as string) || null;
      }
      default:
        return null;
    }
  } catch (error) {
    console.error('Error extracting phone from payload:', error);
    return null;
  }
}

// Extract event type from different CRM payloads
function extractEventType(crmType: CrmType, payload: Record<string, unknown>): string {
  try {
    switch (crmType) {
      case 'jobber': {
        const event = payload.webHookEvent as Record<string, unknown> | undefined;
        return (event?.topic as string) || 'unknown';
      }
      case 'servicetitan': {
        return (payload.eventType as string) || 'unknown';
      }
      case 'housecall_pro': {
        return (payload.event as string) || 'unknown';
      }
      default:
        return 'unknown';
    }
  } catch {
    return 'unknown';
  }
}

// Events that should trigger campaign removal
const REMOVAL_EVENTS: Record<CrmType, string[]> = {
  jobber: ['JOB_CREATED', 'JOB_COMPLETED', 'INVOICE_CREATED', 'CLIENT_UPDATED'],
  servicetitan: ['Job.Created', 'Job.Completed', 'Job.Scheduled', 'Customer.Created'],
  housecall_pro: ['job.created', 'job.completed', 'job.scheduled', 'estimate.accepted'],
};

// Normalize phone number for matching
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const url = new URL(req.url);
    const crmType = url.searchParams.get('crm') as CrmType | null;
    const userId = url.searchParams.get('user_id');

    if (!crmType || !['jobber', 'servicetitan', 'housecall_pro'].includes(crmType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing crm parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rawBody = await req.text();
    const payload = JSON.parse(rawBody) as Record<string, unknown>;

    console.log(`[crm-webhook] Received ${crmType} webhook for user ${userId}:`, JSON.stringify(payload).slice(0, 500));

    // Get the webhook secret for this user and CRM
    const { data: secretData } = await supabase
      .from('crm_webhook_secrets')
      .select('secret_key')
      .eq('user_id', userId)
      .eq('crm_type', crmType)
      .eq('is_active', true)
      .single();

    // Verify signature if secret is configured
    if (secretData?.secret_key) {
      let isValid = false;
      const signature = req.headers.get(`x-${crmType.replace('_', '-')}-signature`) || '';

      switch (crmType) {
        case 'jobber':
          isValid = await verifyJobberSignature(rawBody, signature, secretData.secret_key);
          break;
        case 'servicetitan':
          isValid = await verifyServiceTitanSignature(rawBody, signature, secretData.secret_key);
          break;
        case 'housecall_pro':
          isValid = await verifyHouseCallProSignature(rawBody, signature, secretData.secret_key);
          break;
      }

      if (!isValid) {
        console.error(`[crm-webhook] Invalid signature for ${crmType} webhook`);
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log(`[crm-webhook] No webhook secret configured for ${crmType}, skipping signature verification`);
    }

    // Extract event details
    const eventType = extractEventType(crmType, payload);
    const customerPhone = extractPhoneFromPayload(crmType, payload);

    console.log(`[crm-webhook] Event: ${eventType}, Phone: ${customerPhone}`);

    // Check if this event should trigger campaign removal
    const shouldRemove = REMOVAL_EVENTS[crmType].some(e => 
      eventType.toLowerCase().includes(e.toLowerCase())
    );

    if (!shouldRemove) {
      console.log(`[crm-webhook] Event ${eventType} does not trigger campaign removal`);
      return new Response(
        JSON.stringify({ success: true, action: 'ignored', reason: 'Event type does not trigger removal' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!customerPhone) {
      console.log(`[crm-webhook] No phone number found in payload`);
      return new Response(
        JSON.stringify({ success: true, action: 'ignored', reason: 'No phone number in payload' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedPhone = normalizePhone(customerPhone);
    console.log(`[crm-webhook] Looking for enrollments with phone: ${normalizedPhone}`);

    // Find active campaign enrollments for this phone number
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('sms_campaign_enrollments')
      .select('id, campaign_id, lead_phone')
      .eq('user_id', userId)
      .in('status', ['active', 'pending'])
      .or(`lead_phone.ilike.%${normalizedPhone}%,lead_phone.ilike.%${customerPhone}%`);

    if (enrollmentError) {
      console.error('[crm-webhook] Error fetching enrollments:', enrollmentError);
      throw enrollmentError;
    }

    if (!enrollments || enrollments.length === 0) {
      console.log(`[crm-webhook] No active enrollments found for phone ${normalizedPhone}`);
      return new Response(
        JSON.stringify({ success: true, action: 'no_match', removed_count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[crm-webhook] Found ${enrollments.length} active enrollments to remove`);

    // Update enrollments to completed status
    const enrollmentIds = enrollments.map(e => e.id);
    const { error: updateError } = await supabase
      .from('sms_campaign_enrollments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        metadata: {
          removed_by: 'crm_webhook',
          crm_type: crmType,
          event_type: eventType,
          removed_at: new Date().toISOString(),
        }
      })
      .in('id', enrollmentIds);

    if (updateError) {
      console.error('[crm-webhook] Error updating enrollments:', updateError);
      throw updateError;
    }

    // Also update the conversation status if needed
    const { data: conversations } = await supabase
      .from('sms_conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .or(`lead_phone.ilike.%${normalizedPhone}%,lead_phone.ilike.%${customerPhone}%`);

    if (conversations && conversations.length > 0) {
      await supabase
        .from('sms_conversations')
        .update({
          conversion_status: 'converted_external',
          metadata: {
            converted_by: 'crm_webhook',
            crm_type: crmType,
            event_type: eventType,
          }
        })
        .in('id', conversations.map(c => c.id));
    }

    // Log the sync event
    const { data: connection } = await supabase
      .from('crm_connections')
      .select('id')
      .eq('user_id', userId)
      .eq('crm_type', crmType)
      .single();

    if (connection) {
      await supabase.from('crm_sync_logs').insert({
        user_id: userId,
        crm_connection_id: connection.id,
        sync_type: 'webhook',
        direction: 'pull',
        entity_type: 'campaign_removal',
        entity_id: enrollmentIds[0],
        status: 'success',
        payload: {
          event_type: eventType,
          phone: customerPhone,
          enrollments_removed: enrollmentIds.length,
        },
      });
    }

    console.log(`[crm-webhook] Successfully removed ${enrollmentIds.length} enrollments`);

    return new Response(
      JSON.stringify({
        success: true,
        action: 'removed',
        removed_count: enrollmentIds.length,
        event_type: eventType,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[crm-webhook] Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
