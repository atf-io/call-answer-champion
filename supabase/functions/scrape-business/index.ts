const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping business URL:', formattedUrl);

    // First scrape for branding and basic content
    const brandingResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown', 'branding'],
        onlyMainContent: false,
      }),
    });

    const brandingData = await brandingResponse.json();

    if (!brandingResponse.ok) {
      console.error('Firecrawl branding API error:', brandingData);
      return new Response(
        JSON.stringify({ success: false, error: brandingData.error || `Request failed with status ${brandingResponse.status}` }),
        { status: brandingResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Now do a JSON extraction for structured business data
    const extractionResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: [{
          type: 'json',
          schema: {
            type: 'object',
            properties: {
              business_name: { type: 'string', description: 'The name of the business or company' },
              business_description: { type: 'string', description: 'A brief description of what the business does' },
              phone: { type: 'string', description: 'Phone number of the business' },
              address: { type: 'string', description: 'Physical address of the business' },
              services: { 
                type: 'array', 
                items: { type: 'string' },
                description: 'List of services or products offered'
              },
              team_info: { type: 'string', description: 'Information about the team or staff' },
              faqs: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    question: { type: 'string' },
                    answer: { type: 'string' }
                  }
                },
                description: 'Frequently asked questions'
              },
              social_links: {
                type: 'object',
                properties: {
                  facebook: { type: 'string' },
                  twitter: { type: 'string' },
                  instagram: { type: 'string' },
                  linkedin: { type: 'string' },
                  youtube: { type: 'string' }
                },
                description: 'Social media profile URLs'
              }
            }
          }
        }],
        onlyMainContent: false,
      }),
    });

    const extractionData = await extractionResponse.json();

    if (!extractionResponse.ok) {
      console.error('Firecrawl extraction API error:', extractionData);
      // Continue with branding data even if extraction fails
    }

    // Access data correctly from the response structure
    const branding = brandingData.data?.branding || brandingData.branding || {};
    const metadata = brandingData.data?.metadata || brandingData.metadata || {};
    const extractedJson = extractionData.data?.json || extractionData.json || {};

    // Combine all data into a comprehensive business profile
    const businessData = {
      success: true,
      data: {
        // Basic info from extraction
        business_name: extractedJson.business_name || metadata.title || '',
        business_description: extractedJson.business_description || metadata.description || '',
        phone: extractedJson.phone || '',
        address: extractedJson.address || '',
        website: formattedUrl,
        
        // Services and team
        services: extractedJson.services || [],
        team_info: extractedJson.team_info || '',
        faqs: extractedJson.faqs || [],
        
        // Branding
        logo_url: branding.images?.logo || branding.logo || '',
        colors: branding.colors || {},
        
        // Social links
        social_links: extractedJson.social_links || {},
      }
    };

    console.log('Business data extracted successfully');
    return new Response(
      JSON.stringify(businessData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping business:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
