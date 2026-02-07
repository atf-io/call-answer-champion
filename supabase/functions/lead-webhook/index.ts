import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

interface LeadPayload {
  source: string;
  phone: string;
  name: string;
  email?: string;
  service?: string;
  address?: string;
  notes?: string;
  user_id?: string; // For direct API calls with user context
}

// Template variable replacement
function renderTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  }
  return result;
}

Deno.serve(async (req) => {
  console.log('[lead-webhook] Received request:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: LeadPayload = await req.json();
    console.log('[lead-webhook] Payload:', JSON.stringify(body));

    // Validate required fields
    if (!body.phone || !body.source) {
      return new Response(JSON.stringify({ error: 'Missing required fields: phone and source' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Authenticate via webhook secret header or user_id in payload
    const webhookSecret = req.headers.get('x-webhook-secret');
    let userId: string | null = body.user_id || null;

    if (webhookSecret && !userId) {
      // Find user by webhook secret
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('user_id')
        .eq('lead_webhook_secret', webhookSecret)
        .single();

      if (settingsError || !settings) {
        console.error('[lead-webhook] Invalid webhook secret');
        return new Response(JSON.stringify({ error: 'Invalid webhook secret' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = settings.user_id;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required: provide x-webhook-secret header or user_id' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[lead-webhook] Authenticated user:', userId);

    // Normalize phone number
    const normalizedPhone = body.phone.replace(/\D/g, '').replace(/^1/, '');
    const e164Phone = `+1${normalizedPhone}`;

    // Get business profile for template variables
    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name, business_services')
      .eq('user_id', userId)
      .single();

    // 1. Create contact
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        user_id: userId,
        name: body.name || 'Unknown',
        phone: e164Phone,
        email: body.email,
        source: body.source,
        service_requested: body.service,
        address: body.address,
        notes: body.notes,
        status: 'new',
      })
      .select()
      .single();

    if (contactError) {
      console.error('[lead-webhook] Failed to create contact:', contactError);
      return new Response(JSON.stringify({ error: 'Failed to create contact', details: contactError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[lead-webhook] Created contact:', contact.id);

    // 2. Find or create SMS agent (use first active one or first one)
    const { data: smsAgents } = await supabase
      .from('sms_agents')
      .select('id, name')
      .eq('user_id', userId)
      .order('is_active', { ascending: false })
      .limit(1);

    let smsAgentId: string | null = null;
    let agentName = 'AI Assistant';

    if (smsAgents && smsAgents.length > 0) {
      smsAgentId = smsAgents[0].id;
      agentName = smsAgents[0].name;
    } else {
      // Create a default SMS agent
      const { data: newAgent } = await supabase
        .from('sms_agents')
        .insert({
          user_id: userId,
          name: 'Speed to Lead Agent',
          agent_type: 'speed-to-lead',
          is_active: true,
        })
        .select()
        .single();

      if (newAgent) {
        smsAgentId = newAgent.id;
        agentName = newAgent.name;
      }
    }

    if (!smsAgentId) {
      return new Response(JSON.stringify({ error: 'No SMS agent available' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Create SMS conversation linked to contact
    const { data: conversation, error: convError } = await supabase
      .from('sms_conversations')
      .insert({
        user_id: userId,
        sms_agent_id: smsAgentId,
        contact_id: contact.id,
        lead_phone: e164Phone,
        lead_name: body.name,
        lead_email: body.email,
        lead_source: body.source,
        status: 'active',
        service_details: body.service,
        address_collected: body.address,
      })
      .select()
      .single();

    if (convError) {
      console.error('[lead-webhook] Failed to create conversation:', convError);
      return new Response(JSON.stringify({ error: 'Failed to create conversation', details: convError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[lead-webhook] Created conversation:', conversation.id);

    // 4. Find matching active campaigns by lead_sources
    const { data: campaigns } = await supabase
      .from('sms_campaigns')
      .select('id, name, lead_sources, sms_agent_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .contains('lead_sources', [body.source]);

    console.log('[lead-webhook] Found matching campaigns:', campaigns?.length || 0);

    const enrollments: { campaignId: string; campaignName: string; enrollmentId: string }[] = [];

    // Template variables for message rendering
    const firstName = body.name?.split(' ')[0] || 'there';
    const templateVars: Record<string, string> = {
      first_name: firstName,
      business_name: profile?.business_name || 'Our Team',
      service_category: body.service || 'your request',
      agent_name: agentName,
      lead_source: body.source,
    };

    // 5. Enroll in each matching campaign
    if (campaigns && campaigns.length > 0) {
      for (const campaign of campaigns) {
        // Get first step of campaign
        const { data: firstStep } = await supabase
          .from('sms_campaign_steps')
          .select('*')
          .eq('campaign_id', campaign.id)
          .eq('step_order', 1)
          .single();

        if (!firstStep) {
          console.log(`[lead-webhook] Campaign ${campaign.id} has no steps, skipping`);
          continue;
        }

        // Calculate delay in minutes from days + hours
        const delayMinutes = (firstStep.delay_days || 0) * 1440 + (firstStep.delay_hours || 0) * 60;
        const nextMessageAt = new Date(Date.now() + delayMinutes * 60 * 1000);

        // Create enrollment
        const { data: enrollment, error: enrollError } = await supabase
          .from('sms_campaign_enrollments')
          .insert({
            user_id: userId,
            campaign_id: campaign.id,
            conversation_id: conversation.id,
            lead_phone: e164Phone,
            lead_name: body.name,
            lead_source: body.source,
            current_step_order: 1,
            next_message_at: delayMinutes === 0 ? null : nextMessageAt.toISOString(),
            status: delayMinutes === 0 ? 'active' : 'active',
            metadata: { service: body.service, address: body.address },
          })
          .select()
          .single();

        if (enrollError) {
          console.error(`[lead-webhook] Failed to enroll in campaign ${campaign.id}:`, enrollError);
          continue;
        }

        enrollments.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          enrollmentId: enrollment.id,
        });

        console.log(`[lead-webhook] Enrolled in campaign ${campaign.name}, delay: ${delayMinutes}min`);

        // If delay is 0, send first message immediately
        if (delayMinutes === 0) {
          const messageContent = renderTemplate(firstStep.message_template, templateVars);
          
          // Record message in sms_messages
          await supabase.from('sms_messages').insert({
            conversation_id: conversation.id,
            sender_type: 'agent',
            content: messageContent,
            is_greeting: true,
            metadata: { campaign_id: campaign.id, step_order: 1 },
          });

          // Send via Retell (placeholder - actual SMS sending logic)
          console.log(`[lead-webhook] Sending immediate message: ${messageContent.substring(0, 50)}...`);

          // Update enrollment to next step
          const { data: nextStep } = await supabase
            .from('sms_campaign_steps')
            .select('*')
            .eq('campaign_id', campaign.id)
            .eq('step_order', 2)
            .single();

          if (nextStep) {
            const nextDelayMinutes = (nextStep.delay_days || 0) * 1440 + (nextStep.delay_hours || 0) * 60;
            const nextTime = new Date(Date.now() + nextDelayMinutes * 60 * 1000);
            
            await supabase
              .from('sms_campaign_enrollments')
              .update({
                current_step_order: 2,
                next_message_at: nextTime.toISOString(),
              })
              .eq('id', enrollment.id);
          } else {
            // No more steps, mark as completed
            await supabase
              .from('sms_campaign_enrollments')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
              })
              .eq('id', enrollment.id);
          }
        }
      }
    }

    // Update contact last_contacted_at if we sent a message
    if (enrollments.length > 0) {
      await supabase
        .from('contacts')
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('id', contact.id);
    }

    return new Response(JSON.stringify({
      success: true,
      contact_id: contact.id,
      conversation_id: conversation.id,
      enrollments,
      message: `Contact created and enrolled in ${enrollments.length} campaign(s)`,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[lead-webhook] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
