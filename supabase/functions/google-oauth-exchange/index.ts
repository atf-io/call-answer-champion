import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, redirectUri, action } = await req.json()

    // Get auth token from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verify the user with anon key first
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Handle disconnect action
    if (action === 'disconnect') {
      // Delete OAuth tokens
      await supabase
        .from('google_oauth_tokens')
        .delete()
        .eq('user_id', user.id)

      // Update google_integrations to disconnected
      await supabase
        .from('google_integrations')
        .update({ is_connected: false })
        .eq('user_id', user.id)

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate required fields for token exchange
    if (!code || !redirectUri) {
      return new Response(
        JSON.stringify({ error: 'Missing code or redirectUri' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Google OAuth credentials from environment
    const googleClientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')
    const googleClientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')

    if (!googleClientId || !googleClientSecret) {
      return new Response(
        JSON.stringify({ error: 'Google OAuth not configured. Please add GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: googleClientId,
        client_secret: googleClientSecret,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to exchange authorization code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const tokens = await tokenResponse.json()

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString()

    // Store tokens in database (upsert to handle existing records)
    const { error: upsertError } = await supabase
      .from('google_oauth_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        token_type: tokens.token_type || 'Bearer',
        expires_at: expiresAt,
        scope: tokens.scope || null,
      }, { onConflict: 'user_id' })

    if (upsertError) {
      console.error('Failed to store tokens:', upsertError)
      return new Response(
        JSON.stringify({ error: 'Failed to store tokens' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create or update google_integrations record
    const { data: existingIntegration } = await supabase
      .from('google_integrations')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingIntegration) {
      await supabase
        .from('google_integrations')
        .update({ 
          is_connected: true, 
          last_synced_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
    } else {
      await supabase
        .from('google_integrations')
        .insert({
          user_id: user.id,
          business_name: 'My Business',
          is_connected: true,
          last_synced_at: new Date().toISOString(),
        })
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in google-oauth-exchange:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})