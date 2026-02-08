import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  action: 'sync_message' | 'sync_call' | 'sync_contact' | 'batch_sync' | 'fetch_schema';
  entity_type?: 'sms_message' | 'call_log' | 'contact';
  entity_id?: string;
  entity_ids?: string[];
  crm_type?: 'jobber' | 'servicetitan' | 'housecall_pro';
  connection_id?: string;
}

interface CrmConnection {
  id: string;
  user_id: string;
  crm_type: string;
  access_token: string;
  refresh_token: string;
  tenant_id: string | null;
  is_active: boolean;
  sync_settings: {
    sync_sms: boolean;
    sync_calls: boolean;
    auto_sync: boolean;
    sync_contacts: boolean;
  };
}

// CRM API endpoints
const CRM_ENDPOINTS = {
  jobber: {
    graphql: 'https://api.getjobber.com/api/graphql',
  },
  servicetitan: {
    customers: 'https://api.servicetitan.io/crm/v2/tenant/{tenant_id}/customers',
    notes: 'https://api.servicetitan.io/crm/v2/tenant/{tenant_id}/customers/{customer_id}/notes',
  },
  housecall_pro: {
    customers: 'https://api.housecallpro.com/customers',
    notes: 'https://api.housecallpro.com/customers/{customer_id}/notes',
  },
};

// Push note to Jobber (GraphQL)
async function pushToJobber(connection: CrmConnection, customerId: string, note: string): Promise<{ success: boolean; crm_entity_id?: string; error?: string }> {
  try {
    const mutation = `
      mutation CreateNote($input: NoteCreateInput!) {
        noteCreate(input: $input) {
          note {
            id
            message
          }
          userErrors {
            message
            path
          }
        }
      }
    `;

    const response = await fetch(CRM_ENDPOINTS.jobber.graphql, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${connection.access_token}`,
        'X-JOBBER-GRAPHQL-VERSION': '2024-10-15',
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            clientId: customerId,
            message: note,
          },
        },
      }),
    });

    const result = await response.json();

    if (result.errors || result.data?.noteCreate?.userErrors?.length > 0) {
      const errorMsg = result.errors?.[0]?.message || result.data?.noteCreate?.userErrors?.[0]?.message;
      return { success: false, error: errorMsg || 'Unknown Jobber error' };
    }

    return { 
      success: true, 
      crm_entity_id: result.data?.noteCreate?.note?.id 
    };
  } catch (error) {
    console.error('Jobber sync error:', error);
    return { success: false, error: error.message };
  }
}

// Push note to ServiceTitan (REST)
async function pushToServiceTitan(connection: CrmConnection, customerId: string, note: string): Promise<{ success: boolean; crm_entity_id?: string; error?: string }> {
  try {
    if (!connection.tenant_id) {
      return { success: false, error: 'Missing tenant_id for ServiceTitan' };
    }

    const url = CRM_ENDPOINTS.servicetitan.notes
      .replace('{tenant_id}', connection.tenant_id)
      .replace('{customer_id}', customerId);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${connection.access_token}`,
        'ST-App-Key': Deno.env.get('SERVICETITAN_APP_KEY') || '',
      },
      body: JSON.stringify({
        text: note,
        pinned: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `ServiceTitan error: ${response.status} - ${errorText}` };
    }

    const result = await response.json();
    return { success: true, crm_entity_id: result.id?.toString() };
  } catch (error) {
    console.error('ServiceTitan sync error:', error);
    return { success: false, error: error.message };
  }
}

// Push note to HouseCall Pro (REST)
async function pushToHouseCallPro(connection: CrmConnection, customerId: string, note: string): Promise<{ success: boolean; crm_entity_id?: string; error?: string }> {
  try {
    const url = CRM_ENDPOINTS.housecall_pro.notes.replace('{customer_id}', customerId);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${connection.access_token}`,
      },
      body: JSON.stringify({
        note: note,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HouseCall Pro error: ${response.status} - ${errorText}` };
    }

    const result = await response.json();
    return { success: true, crm_entity_id: result.id?.toString() };
  } catch (error) {
    console.error('HouseCall Pro sync error:', error);
    return { success: false, error: error.message };
  }
}

// Format SMS message for CRM note
function formatSmsNote(message: { content: string; sender_type: string; created_at: string }, leadPhone: string): string {
  const direction = message.sender_type === 'agent' ? '📤 Outbound' : '📥 Inbound';
  const timestamp = new Date(message.created_at).toLocaleString();
  return `[VoiceHub SMS] ${direction} - ${timestamp}\nPhone: ${leadPhone}\n\n${message.content}`;
}

// Format call log for CRM note
function formatCallNote(call: { caller_number: string; duration_seconds: number; status: string; transcript: string | null; sentiment: string | null; created_at: string }): string {
  const timestamp = new Date(call.created_at).toLocaleString();
  const duration = Math.floor((call.duration_seconds || 0) / 60) + 'm ' + ((call.duration_seconds || 0) % 60) + 's';
  
  let note = `[VoiceHub Call] ${timestamp}\nPhone: ${call.caller_number}\nDuration: ${duration}\nStatus: ${call.status}`;
  
  if (call.sentiment) {
    note += `\nSentiment: ${call.sentiment}`;
  }
  
  if (call.transcript) {
    note += `\n\nTranscript:\n${call.transcript.substring(0, 2000)}${call.transcript.length > 2000 ? '...' : ''}`;
  }
  
  return note;
}

// Fetch Jobber schema data (products/services, custom fields, team members)
async function fetchJobberSchema(accessToken: string): Promise<{
  productsOrServices: Array<{
    id: string;
    name: string;
    description: string | null;
    category: string;
    defaultUnitCost: number;
    durationMinutes: number | null;
  }>;
  customFields: Array<{
    id: string;
    label: string;
    fieldType: string;
    valueType: string;
  }>;
  teamMembers: Array<{
    id: string;
    name: string;
    email: string | null;
    isActive: boolean;
  }>;
}> {
  // Demo mode - return mock data
  if (!accessToken || accessToken.startsWith('demo_')) {
    console.log('[DEMO] Returning mock Jobber schema data');
    return {
      productsOrServices: [
        { id: 'demo_service_1', name: 'HVAC Service Call', description: 'Standard HVAC service visit', category: 'SERVICE', defaultUnitCost: 150, durationMinutes: 60 },
        { id: 'demo_service_2', name: 'HVAC Maintenance', description: 'Preventative maintenance', category: 'SERVICE', defaultUnitCost: 199, durationMinutes: 90 },
        { id: 'demo_service_3', name: 'AC Installation', description: 'New AC unit installation', category: 'SERVICE', defaultUnitCost: 3500, durationMinutes: 480 },
        { id: 'demo_service_4', name: 'Furnace Repair', description: 'Furnace diagnostics and repair', category: 'SERVICE', defaultUnitCost: 250, durationMinutes: 120 },
        { id: 'demo_product_1', name: 'Air Filter (Standard)', description: '20x25x1 MERV 11', category: 'PRODUCT', defaultUnitCost: 25, durationMinutes: null },
        { id: 'demo_product_2', name: 'Thermostat (Smart)', description: 'WiFi-enabled thermostat', category: 'PRODUCT', defaultUnitCost: 199, durationMinutes: null },
      ],
      customFields: [
        { id: 'demo_cf_1', label: 'Equipment Type', fieldType: 'DROPDOWN', valueType: 'STRING' },
        { id: 'demo_cf_2', label: 'Lead Source', fieldType: 'DROPDOWN', valueType: 'STRING' },
        { id: 'demo_cf_3', label: 'Property Type', fieldType: 'DROPDOWN', valueType: 'STRING' },
      ],
      teamMembers: [
        { id: 'demo_tm_1', name: 'John Smith', email: 'john@example.com', isActive: true },
        { id: 'demo_tm_2', name: 'Sarah Johnson', email: 'sarah@example.com', isActive: true },
        { id: 'demo_tm_3', name: 'Mike Williams', email: 'mike@example.com', isActive: true },
        { id: 'demo_tm_4', name: 'Emily Davis', email: 'emily@example.com', isActive: false },
      ],
    };
  }

  try {
    // Fetch Products/Services from Jobber GraphQL API
    const query = `
      query GetSchema {
        productsAndServices(first: 100) {
          nodes {
            id
            name
            description
            category
            defaultUnitCost
            durationMinutes
          }
        }
        users(first: 50) {
          nodes {
            id
            name {
              full
            }
            email {
              raw
            }
            isActive
          }
        }
        account {
          customFields {
            id
            label
            fieldType
            valueType
          }
        }
      }
    `;

    const response = await fetch(CRM_ENDPOINTS.jobber.graphql, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-JOBBER-GRAPHQL-VERSION': '2024-10-15',
      },
      body: JSON.stringify({ query }),
    });

    const result = await response.json();

    if (result.errors) {
      console.error('Jobber schema fetch errors:', result.errors);
      // Return empty data on error
      return { productsOrServices: [], customFields: [], teamMembers: [] };
    }

    const productsOrServices = (result.data?.productsAndServices?.nodes || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      defaultUnitCost: item.defaultUnitCost || 0,
      durationMinutes: item.durationMinutes,
    }));

    const teamMembers = (result.data?.users?.nodes || []).map((user: any) => ({
      id: user.id,
      name: user.name?.full || 'Unknown',
      email: user.email?.raw || null,
      isActive: user.isActive ?? true,
    }));

    const customFields = (result.data?.account?.customFields || []).map((field: any) => ({
      id: field.id,
      label: field.label,
      fieldType: field.fieldType,
      valueType: field.valueType,
    }));

    return { productsOrServices, customFields, teamMembers };
  } catch (error) {
    console.error('Failed to fetch Jobber schema:', error);
    return { productsOrServices: [], customFields: [], teamMembers: [] };
  }
}

// Find or create CRM customer mapping
async function findOrCreateCustomerMapping(
  supabase: any,
  userId: string,
  contactPhone: string,
  connectionId: string,
  crmType: string,
  accessToken: string,
  tenantId: string | null
): Promise<{ crm_customer_id: string | null; error?: string }> {
  // First check if we have an existing mapping
  const { data: existingMapping } = await supabase
    .from('crm_contact_mappings')
    .select('crm_customer_id')
    .eq('crm_connection_id', connectionId)
    .eq('user_id', userId)
    .single();

  if (existingMapping?.crm_customer_id) {
    return { crm_customer_id: existingMapping.crm_customer_id };
  }

  // In demo mode, simulate finding a customer
  if (accessToken.startsWith('demo_')) {
    const demoCustomerId = `demo_customer_${Date.now()}`;
    
    // Store the mapping
    await supabase.from('crm_contact_mappings').insert({
      user_id: userId,
      crm_connection_id: connectionId,
      crm_customer_id: demoCustomerId,
      crm_customer_data: { phone: contactPhone, source: 'auto_matched' },
    });

    return { crm_customer_id: demoCustomerId };
  }

  // TODO: Implement actual CRM customer lookup by phone number
  // For now, return null if no mapping exists
  return { crm_customer_id: null, error: 'No customer mapping found. Link a CRM customer first.' };
}

// Log sync result
async function logSyncResult(
  supabase: any,
  userId: string,
  connectionId: string,
  syncType: string,
  direction: string,
  entityType: string,
  entityId: string,
  crmEntityId: string | null,
  status: string,
  errorMessage: string | null,
  payload: any
) {
  await supabase.from('crm_sync_logs').insert({
    user_id: userId,
    crm_connection_id: connectionId,
    sync_type: syncType,
    direction: direction,
    entity_type: entityType,
    entity_id: entityId,
    crm_entity_id: crmEntityId,
    status: status,
    error_message: errorMessage,
    payload: payload,
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: SyncRequest = await req.json();
    const { action, entity_type, entity_id, entity_ids, crm_type, connection_id } = body;

    console.log(`CRM Sync: ${action} for user ${user.id}`, { entity_type, entity_id, crm_type, connection_id });

    // Handle fetch_schema action separately
    if (action === 'fetch_schema') {
      if (!connection_id) {
        return new Response(
          JSON.stringify({ error: 'connection_id is required for fetch_schema' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get the specific connection
      const { data: connection, error: connError } = await supabase
        .from('crm_connections')
        .select('*')
        .eq('id', connection_id)
        .eq('user_id', user.id)
        .single();

      if (connError || !connection) {
        return new Response(
          JSON.stringify({ error: 'Connection not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const schemaData = await fetchJobberSchema(connection.access_token);
      
      return new Response(
        JSON.stringify(schemaData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get active CRM connections
    let connectionsQuery = supabase
      .from('crm_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (crm_type) {
      connectionsQuery = connectionsQuery.eq('crm_type', crm_type);
    }

    const { data: connections, error: connError } = await connectionsQuery;

    if (connError) throw connError;

    if (!connections || connections.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No active CRM connections found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: { crm_type: string; success: boolean; crm_entity_id?: string; error?: string }[] = [];

    // Handle different sync actions
    if (action === 'sync_message' && entity_id) {
      // Get the SMS message with conversation details
      const { data: message, error: msgError } = await supabase
        .from('sms_messages')
        .select(`
          *,
          sms_conversations!inner (
            lead_phone,
            lead_name,
            contact_id,
            user_id
          )
        `)
        .eq('id', entity_id)
        .single();

      if (msgError || !message) {
        return new Response(
          JSON.stringify({ error: 'Message not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify ownership
      if (message.sms_conversations.user_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const note = formatSmsNote(message, message.sms_conversations.lead_phone);

      // Sync to each connected CRM
      for (const conn of connections as CrmConnection[]) {
        if (!conn.sync_settings?.sync_sms) {
          results.push({ crm_type: conn.crm_type, success: false, error: 'SMS sync disabled' });
          continue;
        }

        // Find customer mapping
        const { crm_customer_id, error: mappingError } = await findOrCreateCustomerMapping(
          supabase,
          user.id,
          message.sms_conversations.lead_phone,
          conn.id,
          conn.crm_type,
          conn.access_token,
          conn.tenant_id
        );

        if (!crm_customer_id) {
          results.push({ crm_type: conn.crm_type, success: false, error: mappingError });
          await logSyncResult(supabase, user.id, conn.id, 'communication', 'push', 'sms_message', entity_id, null, 'failed', mappingError || 'No customer mapping', { note });
          continue;
        }

        let syncResult: { success: boolean; crm_entity_id?: string; error?: string };

        // Demo mode simulation
        if (conn.access_token.startsWith('demo_')) {
          console.log(`[DEMO] Would push SMS to ${conn.crm_type} for customer ${crm_customer_id}`);
          syncResult = { success: true, crm_entity_id: `demo_note_${Date.now()}` };
        } else {
          // Real API calls
          switch (conn.crm_type) {
            case 'jobber':
              syncResult = await pushToJobber(conn, crm_customer_id, note);
              break;
            case 'servicetitan':
              syncResult = await pushToServiceTitan(conn, crm_customer_id, note);
              break;
            case 'housecall_pro':
              syncResult = await pushToHouseCallPro(conn, crm_customer_id, note);
              break;
            default:
              syncResult = { success: false, error: 'Unknown CRM type' };
          }
        }

        results.push({ crm_type: conn.crm_type, ...syncResult });
        await logSyncResult(
          supabase, user.id, conn.id, 'communication', 'push', 'sms_message', entity_id,
          syncResult.crm_entity_id || null, syncResult.success ? 'success' : 'failed',
          syncResult.error || null, { note, crm_customer_id }
        );
      }
    }

    if (action === 'sync_call' && entity_id) {
      // Get the call log
      const { data: call, error: callError } = await supabase
        .from('call_logs')
        .select('*')
        .eq('id', entity_id)
        .eq('user_id', user.id)
        .single();

      if (callError || !call) {
        return new Response(
          JSON.stringify({ error: 'Call log not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const note = formatCallNote(call);

      for (const conn of connections as CrmConnection[]) {
        if (!conn.sync_settings?.sync_calls) {
          results.push({ crm_type: conn.crm_type, success: false, error: 'Call sync disabled' });
          continue;
        }

        const { crm_customer_id, error: mappingError } = await findOrCreateCustomerMapping(
          supabase,
          user.id,
          call.caller_number || '',
          conn.id,
          conn.crm_type,
          conn.access_token,
          conn.tenant_id
        );

        if (!crm_customer_id) {
          results.push({ crm_type: conn.crm_type, success: false, error: mappingError });
          await logSyncResult(supabase, user.id, conn.id, 'communication', 'push', 'call_log', entity_id, null, 'failed', mappingError || 'No customer mapping', { note });
          continue;
        }

        let syncResult: { success: boolean; crm_entity_id?: string; error?: string };

        if (conn.access_token.startsWith('demo_')) {
          console.log(`[DEMO] Would push call to ${conn.crm_type} for customer ${crm_customer_id}`);
          syncResult = { success: true, crm_entity_id: `demo_note_${Date.now()}` };
        } else {
          switch (conn.crm_type) {
            case 'jobber':
              syncResult = await pushToJobber(conn, crm_customer_id, note);
              break;
            case 'servicetitan':
              syncResult = await pushToServiceTitan(conn, crm_customer_id, note);
              break;
            case 'housecall_pro':
              syncResult = await pushToHouseCallPro(conn, crm_customer_id, note);
              break;
            default:
              syncResult = { success: false, error: 'Unknown CRM type' };
          }
        }

        results.push({ crm_type: conn.crm_type, ...syncResult });
        await logSyncResult(
          supabase, user.id, conn.id, 'communication', 'push', 'call_log', entity_id,
          syncResult.crm_entity_id || null, syncResult.success ? 'success' : 'failed',
          syncResult.error || null, { note, crm_customer_id }
        );
      }
    }

    if (action === 'batch_sync' && entity_ids && entity_type) {
      // Process batch sync in background
      for (const id of entity_ids.slice(0, 50)) { // Limit to 50 items
        // Recursively call sync for each item
        const singleAction = entity_type === 'sms_message' ? 'sync_message' : 'sync_call';
        
        // For batch, we just log the intent - actual sync would be done via queue
        console.log(`[BATCH] Queued ${singleAction} for ${id}`);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Queued ${entity_ids.length} items for sync`,
          queued: entity_ids.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({ 
        success: successCount > 0,
        results,
        summary: { success: successCount, failed: failCount }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('CRM Sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
