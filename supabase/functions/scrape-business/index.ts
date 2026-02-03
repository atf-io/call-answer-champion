import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function isValidExternalUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;

    const hostname = parsed.hostname.toLowerCase();

    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') return false;

    if (/^10\./.test(hostname)) return false;
    if (/^172\.(1[6-9]|2[0-9]|3[01])\./.test(hostname)) return false;
    if (/^192\.168\./.test(hostname)) return false;

    if (hostname.startsWith('169.254.')) return false;
    if (hostname.startsWith('fe80:')) return false;

    if (hostname.includes('metadata')) return false;
    if (hostname === '169.254.169.254') return false;

    if (hostname.endsWith('.internal') || hostname.endsWith('.local')) return false;

    return true;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !claimsData?.user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', claimsData.user.id);

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

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    if (!isValidExternalUrl(formattedUrl)) {
      console.error('Invalid or restricted URL:', formattedUrl);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or restricted URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scraping business URL:', formattedUrl);

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
              business_description: { type: 'string', description: 'A comprehensive description of what the business does, their mission, and value proposition' },
              phone: { type: 'string', description: 'Primary phone number of the business' },
              email: { type: 'string', description: 'Primary email address of the business' },
              address: { type: 'string', description: 'Physical address or headquarters location of the business' },
              services: { 
                type: 'array', 
                items: { type: 'string' },
                description: 'Complete list of all services, products, or offerings provided by the business'
              },
              service_area: {
                type: 'object',
                properties: {
                  cities: { type: 'array', items: { type: 'string' }, description: 'Cities served' },
                  counties: { type: 'array', items: { type: 'string' }, description: 'Counties served' },
                  states: { type: 'array', items: { type: 'string' }, description: 'States served' },
                  zip_codes: { type: 'array', items: { type: 'string' }, description: 'ZIP codes served' },
                  radius: { type: 'string', description: 'Service radius from main location if mentioned' },
                  description: { type: 'string', description: 'General description of service area coverage' }
                },
                description: 'Geographic areas where the business provides services'
              },
              business_hours: {
                type: 'object',
                properties: {
                  monday: { type: 'string' },
                  tuesday: { type: 'string' },
                  wednesday: { type: 'string' },
                  thursday: { type: 'string' },
                  friday: { type: 'string' },
                  saturday: { type: 'string' },
                  sunday: { type: 'string' },
                  notes: { type: 'string', description: 'Additional hours info like 24/7 emergency service, holiday hours, etc.' }
                },
                description: 'Business operating hours for each day of the week'
              },
              locations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'Location name or branch name' },
                    address: { type: 'string' },
                    phone: { type: 'string' },
                    hours: { type: 'string' }
                  }
                },
                description: 'All business locations or branches'
              },
              equipment_brands: {
                type: 'array',
                items: { type: 'string' },
                description: 'Brands or equipment the business works with, installs, or services'
              },
              certifications: {
                type: 'array',
                items: { type: 'string' },
                description: 'Professional certifications, licenses, or accreditations'
              },
              team_info: { type: 'string', description: 'Information about the team, staff, or company history and experience' },
              specialties: {
                type: 'array',
                items: { type: 'string' },
                description: 'Areas of specialty or expertise'
              },
              pricing_info: { type: 'string', description: 'Any pricing information, estimates, or financing options mentioned' },
              guarantees: {
                type: 'array',
                items: { type: 'string' },
                description: 'Warranties, guarantees, or satisfaction promises'
              },
              faqs: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    question: { type: 'string' },
                    answer: { type: 'string' }
                  }
                },
                description: 'Frequently asked questions and their answers'
              },
              social_links: {
                type: 'object',
                properties: {
                  facebook: { type: 'string' },
                  twitter: { type: 'string' },
                  instagram: { type: 'string' },
                  linkedin: { type: 'string' },
                  youtube: { type: 'string' },
                  yelp: { type: 'string' },
                  google_business: { type: 'string' },
                  nextdoor: { type: 'string' },
                  bbb: { type: 'string' },
                  angi: { type: 'string' },
                  homeadvisor: { type: 'string' }
                },
                description: 'All social media and review profile URLs'
              },
              payment_methods: {
                type: 'array',
                items: { type: 'string' },
                description: 'Accepted payment methods and financing options'
              },
              emergency_service: { type: 'boolean', description: 'Whether the business offers emergency or 24/7 service' },
              years_in_business: { type: 'string', description: 'How long the business has been operating' },
              tagline: { type: 'string', description: 'Business slogan or tagline' }
            }
          }
        }],
        onlyMainContent: false,
      }),
    });

    const extractionData = await extractionResponse.json();

    if (!extractionResponse.ok) {
      console.error('Firecrawl extraction API error:', extractionData);
    }

    const branding = brandingData.data?.branding || brandingData.branding || {};
    const metadata = brandingData.data?.metadata || brandingData.metadata || {};
    const extractedJson = extractionData.data?.json || extractionData.json || {};

    const businessData = {
      success: true,
      data: {
        business_name: extractedJson.business_name || metadata.title || '',
        business_description: extractedJson.business_description || metadata.description || '',
        tagline: extractedJson.tagline || '',
        phone: extractedJson.phone || '',
        email: extractedJson.email || '',
        address: extractedJson.address || '',
        website: formattedUrl,
        
        services: extractedJson.services || [],
        specialties: extractedJson.specialties || [],
        equipment_brands: extractedJson.equipment_brands || [],
        certifications: extractedJson.certifications || [],
        
        service_area: extractedJson.service_area || {},
        
        business_hours: extractedJson.business_hours || {},
        emergency_service: extractedJson.emergency_service || false,
        
        locations: extractedJson.locations || [],
        
        team_info: extractedJson.team_info || '',
        years_in_business: extractedJson.years_in_business || '',
        pricing_info: extractedJson.pricing_info || '',
        guarantees: extractedJson.guarantees || [],
        payment_methods: extractedJson.payment_methods || [],
        
        faqs: extractedJson.faqs || [],
        
        logo_url: branding.images?.logo || branding.logo || '',
        colors: branding.colors || {},
        
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
