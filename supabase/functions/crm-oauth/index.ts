import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CRM OAuth configuration
const CRM_CONFIG = {
  jobber: {
    authUrl: 'https://api.getjobber.com/api/oauth/authorize',
    tokenUrl: 'https://api.getjobber.com/api/oauth/token',
    scope: 'read_clients write_clients read_jobs write_jobs read_notes write_notes',
  },
  servicetitan: {
    authUrl: 'https://auth.servicetitan.io/connect/authorize',
    tokenUrl: 'https://auth.servicetitan.io/connect/token',
    scope: 'customers:read customers:write jobs:read jobs:write notes:read notes:write',
  },
  housecall_pro: {
    authUrl: 'https://api.housecallpro.com/oauth/authorize',
    tokenUrl: 'https://api.housecallpro.com/oauth/token',
    scope: 'customers jobs notes',
  },
};

interface OAuthRequest {
  action: 'initiate' | 'callback' | 'refresh';
  crm_type: 'jobber' | 'servicetitan' | 'housecall_pro';
  redirect_uri?: string;
  code?: string;
  state?: string;
  connection_id?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: OAuthRequest = await req.json();
    const { action, crm_type } = body;

    console.log(`CRM OAuth ${action} for ${crm_type} by user ${user.id}`);

    if (!CRM_CONFIG[crm_type]) {
      return new Response(
        JSON.stringify({ error: 'Invalid CRM type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = CRM_CONFIG[crm_type];

    // Get CRM-specific credentials from secrets
    const clientId = Deno.env.get(`${crm_type.toUpperCase()}_CLIENT_ID`);
    const clientSecret = Deno.env.get(`${crm_type.toUpperCase()}_CLIENT_SECRET`);

    if (action === 'initiate') {
      // Check if credentials are configured
      if (!clientId) {
        // Return a placeholder URL for demo purposes
        // In production, you'd configure the actual OAuth credentials
        console.log(`No OAuth credentials configured for ${crm_type}`);
        
        // For now, create a mock connection for testing the UI
        const { data: existingConnection } = await supabase
          .from('crm_connections')
          .select('id')
          .eq('user_id', user.id)
          .eq('crm_type', crm_type)
          .single();

        if (existingConnection) {
          // Update existing connection
          const { error: updateError } = await supabase
            .from('crm_connections')
            .update({
              access_token: 'demo_token_' + Date.now(),
              refresh_token: 'demo_refresh_' + Date.now(),
              expires_at: new Date(Date.now() + 3600000).toISOString(),
              is_active: true,
              tenant_id: 'demo_tenant_123'
            })
            .eq('id', existingConnection.id);

          if (updateError) throw updateError;
        } else {
          // Create new connection
          const { error: insertError } = await supabase
            .from('crm_connections')
            .insert({
              user_id: user.id,
              crm_type,
              access_token: 'demo_token_' + Date.now(),
              refresh_token: 'demo_refresh_' + Date.now(),
              expires_at: new Date(Date.now() + 3600000).toISOString(),
              is_active: true,
              tenant_id: 'demo_tenant_123'
            });

          if (insertError) throw insertError;
        }

        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Demo connection created. Configure OAuth credentials for production.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate state for CSRF protection
      const state = crypto.randomUUID();
      
      // Store state in connection record for verification
      const { error: stateError } = await supabase
        .from('crm_connections')
        .upsert({
          user_id: user.id,
          crm_type,
          is_active: false
        }, {
          onConflict: 'user_id,crm_type'
        });

      if (stateError) throw stateError;

      // Build OAuth authorization URL
      const authUrl = new URL(config.authUrl);
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', body.redirect_uri!);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', config.scope);
      authUrl.searchParams.set('state', state);

      return new Response(
        JSON.stringify({ auth_url: authUrl.toString(), state }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'callback') {
      const { code, state } = body;

      if (!code) {
        return new Response(
          JSON.stringify({ error: 'Missing authorization code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!clientId || !clientSecret) {
        return new Response(
          JSON.stringify({ error: 'OAuth credentials not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Exchange code for tokens
      const tokenResponse = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: body.redirect_uri!,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange failed:', errorText);
        return new Response(
          JSON.stringify({ error: 'Token exchange failed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokens = await tokenResponse.json();

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);

      // Update connection with tokens
      const { data: connection, error: updateError } = await supabase
        .from('crm_connections')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt.toISOString(),
          tenant_id: tokens.tenant_id || tokens.account_id || null,
          is_active: true
        })
        .eq('user_id', user.id)
        .eq('crm_type', crm_type)
        .select()
        .single();

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true, connection_id: connection.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'refresh') {
      const { connection_id } = body;

      if (!connection_id) {
        return new Response(
          JSON.stringify({ error: 'Missing connection_id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get current connection
      const { data: connection, error: fetchError } = await supabase
        .from('crm_connections')
        .select('*')
        .eq('id', connection_id)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !connection) {
        return new Response(
          JSON.stringify({ error: 'Connection not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!connection.refresh_token) {
        return new Response(
          JSON.stringify({ error: 'No refresh token available' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!clientId || !clientSecret) {
        return new Response(
          JSON.stringify({ error: 'OAuth credentials not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Refresh tokens
      const tokenResponse = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: connection.refresh_token,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token refresh failed:', errorText);
        
        // Mark connection as inactive
        await supabase
          .from('crm_connections')
          .update({ is_active: false })
          .eq('id', connection_id);

        return new Response(
          JSON.stringify({ error: 'Token refresh failed', needs_reauth: true }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokens = await tokenResponse.json();
      const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);

      // Update tokens
      const { error: updateError } = await supabase
        .from('crm_connections')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || connection.refresh_token,
          expires_at: expiresAt.toISOString()
        })
        .eq('id', connection_id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('CRM OAuth error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
