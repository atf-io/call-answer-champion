import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const googleClientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')

    if (!googleClientId) {
      console.log('GOOGLE_OAUTH_CLIENT_ID not configured')
      return new Response(
        JSON.stringify({ 
          configured: false,
          message: 'Google OAuth is not configured. Please add GOOGLE_OAUTH_CLIENT_ID secret.'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Google OAuth Client ID found, returning config')
    return new Response(
      JSON.stringify({ 
        configured: true,
        clientId: googleClientId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in google-oauth-config:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
