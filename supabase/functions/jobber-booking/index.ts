import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const JOBBER_GRAPHQL_URL = 'https://api.getjobber.com/api/graphql';
const JOBBER_API_VERSION = '2024-10-15';

interface BookingRequest {
  action: 'create_request' | 'check_availability' | 'get_time_slots';
  connection_id: string;
  customer_phone: string;
  customer_name?: string;
  customer_email?: string;
  service_id?: string;
  service_name?: string;
  preferred_date?: string; // ISO date string
  preferred_time?: string; // HH:mm format
  notes?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  technician_id?: string;
}

interface JobberClient {
  id: string;
  firstName: string;
  lastName: string;
  phones?: Array<{ number: string }>;
}

// Find or create a Jobber client by phone number
async function findOrCreateClient(
  accessToken: string,
  phone: string,
  name?: string,
  email?: string
): Promise<{ success: boolean; clientId?: string; error?: string }> {
  try {
    // First, search for existing client by phone
    const searchQuery = `
      query SearchClient($phone: String!) {
        clients(searchTerm: $phone, first: 5) {
          nodes {
            id
            firstName
            lastName
            phones {
              number
            }
          }
        }
      }
    `;

    const searchResponse = await fetch(JOBBER_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-JOBBER-GRAPHQL-VERSION': JOBBER_API_VERSION,
      },
      body: JSON.stringify({
        query: searchQuery,
        variables: { phone },
      }),
    });

    const searchResult = await searchResponse.json();
    console.log('Jobber client search result:', JSON.stringify(searchResult));

    // Check if we found a matching client
    const clients = searchResult.data?.clients?.nodes || [];
    for (const client of clients) {
      const clientPhones = client.phones?.map((p: { number: string }) => p.number.replace(/\D/g, '')) || [];
      const normalizedPhone = phone.replace(/\D/g, '');
      if (clientPhones.some((p: string) => p.includes(normalizedPhone) || normalizedPhone.includes(p))) {
        console.log('Found existing Jobber client:', client.id);
        return { success: true, clientId: client.id };
      }
    }

    // No existing client found, create a new one
    const nameParts = (name || 'Unknown Customer').split(' ');
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    const createMutation = `
      mutation CreateClient($input: ClientCreateInput!) {
        clientCreate(input: $input) {
          client {
            id
            firstName
            lastName
          }
          userErrors {
            message
            path
          }
        }
      }
    `;

    const createInput: Record<string, unknown> = {
      firstName,
      lastName,
      phones: [{ number: phone, description: 'MAIN', primary: true }],
    };

    if (email) {
      createInput.emails = [{ address: email, description: 'MAIN', primary: true }];
    }

    const createResponse = await fetch(JOBBER_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-JOBBER-GRAPHQL-VERSION': JOBBER_API_VERSION,
      },
      body: JSON.stringify({
        query: createMutation,
        variables: { input: createInput },
      }),
    });

    const createResult = await createResponse.json();
    console.log('Jobber client create result:', JSON.stringify(createResult));

    if (createResult.errors || createResult.data?.clientCreate?.userErrors?.length > 0) {
      const errorMsg = createResult.errors?.[0]?.message || 
                       createResult.data?.clientCreate?.userErrors?.[0]?.message ||
                       'Failed to create client';
      return { success: false, error: errorMsg };
    }

    const newClientId = createResult.data?.clientCreate?.client?.id;
    if (!newClientId) {
      return { success: false, error: 'Client created but no ID returned' };
    }

    console.log('Created new Jobber client:', newClientId);
    return { success: true, clientId: newClientId };
  } catch (error) {
    console.error('Error finding/creating Jobber client:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Create a service request in Jobber
async function createServiceRequest(
  accessToken: string,
  clientId: string,
  serviceName: string,
  preferredDate?: string,
  preferredTime?: string,
  notes?: string,
  address?: { street?: string; city?: string; state?: string; zip?: string }
): Promise<{ success: boolean; requestId?: string; requestNumber?: string; error?: string }> {
  try {
    // Build the request title with service and date info
    let title = serviceName;
    if (preferredDate) {
      const dateObj = new Date(preferredDate);
      const formattedDate = dateObj.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
      title = `${serviceName} - ${formattedDate}`;
      if (preferredTime) {
        title += ` @ ${preferredTime}`;
      }
    }

    // Build instructions/notes
    const instructions: string[] = [];
    if (notes) {
      instructions.push(notes);
    }
    if (preferredDate) {
      instructions.push(`Preferred Date: ${preferredDate}`);
    }
    if (preferredTime) {
      instructions.push(`Preferred Time: ${preferredTime}`);
    }
    instructions.push('[Created via VoiceHub AI]');

    const createMutation = `
      mutation CreateRequest($input: RequestCreateInput!) {
        requestCreate(input: $input) {
          request {
            id
            title
            companyName
          }
          userErrors {
            message
            path
          }
        }
      }
    `;

    const requestInput: Record<string, unknown> = {
      clientId,
      title,
      instructions: instructions.join('\n'),
    };

    // Add property/address if provided
    if (address && (address.street || address.city)) {
      requestInput.propertyAttributes = {
        address: {
          street1: address.street || '',
          city: address.city || '',
          province: address.state || '',
          postalCode: address.zip || '',
          country: 'US',
        },
      };
    }

    console.log('Creating Jobber request with input:', JSON.stringify(requestInput));

    const response = await fetch(JOBBER_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-JOBBER-GRAPHQL-VERSION': JOBBER_API_VERSION,
      },
      body: JSON.stringify({
        query: createMutation,
        variables: { input: requestInput },
      }),
    });

    const result = await response.json();
    console.log('Jobber request create result:', JSON.stringify(result));

    if (result.errors || result.data?.requestCreate?.userErrors?.length > 0) {
      const errorMsg = result.errors?.[0]?.message || 
                       result.data?.requestCreate?.userErrors?.[0]?.message ||
                       'Failed to create request';
      return { success: false, error: errorMsg };
    }

    const request = result.data?.requestCreate?.request;
    if (!request?.id) {
      return { success: false, error: 'Request created but no ID returned' };
    }

    return { 
      success: true, 
      requestId: request.id,
      requestNumber: request.title
    };
  } catch (error) {
    console.error('Error creating Jobber request:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Demo mode handler
function handleDemoMode(body: BookingRequest): Response {
  console.log('[DEMO] Processing booking request:', body);
  
  const demoRequestId = `demo_request_${Date.now()}`;
  const demoConfirmation = `REQ-${Math.floor(Math.random() * 10000)}`;
  
  let confirmationMessage = `Your ${body.service_name || 'service'} appointment has been scheduled`;
  if (body.preferred_date) {
    const dateObj = new Date(body.preferred_date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
    confirmationMessage += ` for ${formattedDate}`;
    if (body.preferred_time) {
      confirmationMessage += ` around ${body.preferred_time}`;
    }
  }
  confirmationMessage += `. Confirmation #${demoConfirmation}. A technician will contact you to confirm the exact arrival time.`;

  return new Response(
    JSON.stringify({
      success: true,
      demo: true,
      request_id: demoRequestId,
      confirmation_number: demoConfirmation,
      confirmation_message: confirmationMessage,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
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

    const body: BookingRequest = await req.json();
    console.log(`Jobber Booking: ${body.action} for user ${user.id}`, body);

    const { action, connection_id, customer_phone, customer_name, customer_email, service_name, preferred_date, preferred_time, notes, address } = body;

    if (!connection_id) {
      return new Response(
        JSON.stringify({ error: 'connection_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the CRM connection
    const { data: connection, error: connError } = await supabase
      .from('crm_connections')
      .select('*')
      .eq('id', connection_id)
      .eq('user_id', user.id)
      .eq('crm_type', 'jobber')
      .single();

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: 'Jobber connection not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Demo mode check
    if (!connection.access_token || connection.access_token.startsWith('demo_')) {
      return handleDemoMode(body);
    }

    if (action === 'create_request') {
      if (!customer_phone) {
        return new Response(
          JSON.stringify({ error: 'customer_phone is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Step 1: Find or create the client
      const clientResult = await findOrCreateClient(
        connection.access_token,
        customer_phone,
        customer_name,
        customer_email
      );

      if (!clientResult.success || !clientResult.clientId) {
        return new Response(
          JSON.stringify({ success: false, error: clientResult.error || 'Failed to find/create client' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Step 2: Create the service request
      const requestResult = await createServiceRequest(
        connection.access_token,
        clientResult.clientId,
        service_name || 'Service Request',
        preferred_date,
        preferred_time,
        notes,
        address
      );

      if (!requestResult.success) {
        return new Response(
          JSON.stringify({ success: false, error: requestResult.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Build confirmation message
      let confirmationMessage = `Your ${service_name || 'service'} appointment has been scheduled`;
      if (preferred_date) {
        const dateObj = new Date(preferred_date);
        const formattedDate = dateObj.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        });
        confirmationMessage += ` for ${formattedDate}`;
        if (preferred_time) {
          confirmationMessage += ` around ${preferred_time}`;
        }
      }
      confirmationMessage += `. A technician will contact you to confirm the exact arrival time.`;

      // Log the sync
      await supabase.from('crm_sync_logs').insert({
        user_id: user.id,
        crm_connection_id: connection_id,
        sync_type: 'appointment',
        direction: 'push',
        entity_type: 'request',
        entity_id: null,
        crm_entity_id: requestResult.requestId,
        status: 'success',
        error_message: null,
        payload: { 
          customer_phone, 
          customer_name, 
          service_name, 
          preferred_date, 
          preferred_time 
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          request_id: requestResult.requestId,
          confirmation_number: requestResult.requestNumber,
          confirmation_message: confirmationMessage,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Jobber booking error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
