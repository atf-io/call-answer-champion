import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Template variable replacement
function renderTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  }
  return result;
}

// Send SMS via Retell API
async function sendSmsViaRetell(
  fromNumber: string,
  toNumber: string,
  message: string,
  retellApiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[sms-processor] Sending SMS from ${fromNumber} to ${toNumber}`);
    
    const response = await fetch('https://api.retellai.com/send-message', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${retellApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from_number: fromNumber,
        to_number: toNumber,
        message: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[sms-processor] Retell SMS error:', response.status, errorText);
      return { success: false, error: `Retell API error: ${response.status}` };
    }

    console.log('[sms-processor] SMS sent successfully');
    return { success: true };
  } catch (error) {
    console.error('[sms-processor] Failed to send SMS:', error);
    return { success: false, error: String(error) };
  }
}

// Get user's active phone number
async function getUserFromNumber(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data: phoneNumbers } = await supabase
    .from('phone_numbers')
    .select('phone_number')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1);

  return phoneNumbers?.[0]?.phone_number || null;
}

Deno.serve(async (req) => {
  console.log('[sms-processor] Starting scheduled processing');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const retellApiKey = Deno.env.get('RETELL_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find enrollments that need processing
    const now = new Date().toISOString();
    const { data: enrollments, error: enrollError } = await supabase
      .from('sms_campaign_enrollments')
      .select(`
        *,
        sms_campaigns!inner(id, name, user_id, sms_agent_id),
        sms_conversations!inner(id, lead_phone, lead_name, lead_email, service_details, sms_agent_id, contact_id, message_count)
      `)
      .eq('status', 'active')
      .lte('next_message_at', now)
      .not('next_message_at', 'is', null);

    if (enrollError) {
      console.error('[sms-processor] Error fetching enrollments:', enrollError);
      return new Response(JSON.stringify({ error: 'Failed to fetch enrollments' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[sms-processor] Found ${enrollments?.length || 0} enrollments to process`);

    const results: { enrollmentId: string; status: string; smsSent?: boolean; error?: string }[] = [];

    for (const enrollment of enrollments || []) {
      try {
        console.log(`[sms-processor] Processing enrollment ${enrollment.id} at step ${enrollment.current_step_order}`);

        // Get the current step
        const { data: step } = await supabase
          .from('sms_campaign_steps')
          .select('*')
          .eq('campaign_id', enrollment.campaign_id)
          .eq('step_order', enrollment.current_step_order)
          .single();

        if (!step) {
          console.log(`[sms-processor] No step found for order ${enrollment.current_step_order}, marking completed`);
          await supabase
            .from('sms_campaign_enrollments')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              next_message_at: null,
            })
            .eq('id', enrollment.id);
          
          results.push({ enrollmentId: enrollment.id, status: 'completed' });
          continue;
        }

        // Get user's from number for SMS sending
        const fromNumber = await getUserFromNumber(supabase, enrollment.user_id);
        const canSendSms = !!fromNumber && !!retellApiKey;

        // Get business profile for template variables
        const { data: profile } = await supabase
          .from('profiles')
          .select('business_name')
          .eq('user_id', enrollment.user_id)
          .single();

        // Get SMS agent name
        const { data: agent } = await supabase
          .from('sms_agents')
          .select('name')
          .eq('id', enrollment.sms_conversations.sms_agent_id)
          .single();

        // Build template variables
        const firstName = enrollment.lead_name?.split(' ')[0] || 'there';
        const templateVars: Record<string, string> = {
          first_name: firstName,
          business_name: profile?.business_name || 'Our Team',
          service_category: enrollment.sms_conversations.service_details || 'your request',
          agent_name: agent?.name || 'AI Assistant',
          lead_source: enrollment.lead_source || 'our website',
        };

        // Render the message
        const messageContent = renderTemplate(step.message_template, templateVars);
        console.log(`[sms-processor] Sending message: ${messageContent.substring(0, 50)}...`);

        // Record the message
        await supabase.from('sms_messages').insert({
          conversation_id: enrollment.conversation_id,
          sender_type: 'agent',
          content: messageContent,
          is_follow_up: enrollment.current_step_order > 1,
          metadata: {
            campaign_id: enrollment.campaign_id,
            step_order: enrollment.current_step_order,
            enrollment_id: enrollment.id,
          },
        });

        // Send SMS via Retell
        let smsSent = false;
        if (canSendSms) {
          const smsResult = await sendSmsViaRetell(
            fromNumber!, 
            enrollment.sms_conversations.lead_phone, 
            messageContent, 
            retellApiKey!
          );
          smsSent = smsResult.success;
          if (!smsResult.success) {
            console.error('[sms-processor] SMS delivery failed:', smsResult.error);
          }
        } else {
          console.log('[sms-processor] SMS delivery not available:', { hasFromNumber: !!fromNumber, hasRetellKey: !!retellApiKey });
        }

        // Update conversation
        await supabase
          .from('sms_conversations')
          .update({
            last_message_at: new Date().toISOString(),
            message_count: (enrollment.sms_conversations.message_count || 0) + 1,
          })
          .eq('id', enrollment.conversation_id);

        // Check for next step
        const nextStepOrder = enrollment.current_step_order + 1;
        const { data: nextStep } = await supabase
          .from('sms_campaign_steps')
          .select('*')
          .eq('campaign_id', enrollment.campaign_id)
          .eq('step_order', nextStepOrder)
          .single();

        if (nextStep) {
          // Calculate next message time
          const delayMinutes = (nextStep.delay_days || 0) * 1440 + (nextStep.delay_hours || 0) * 60;
          const nextMessageAt = new Date(Date.now() + delayMinutes * 60 * 1000);

          await supabase
            .from('sms_campaign_enrollments')
            .update({
              current_step_order: nextStepOrder,
              next_message_at: nextMessageAt.toISOString(),
            })
            .eq('id', enrollment.id);

          console.log(`[sms-processor] Advanced to step ${nextStepOrder}, next message at ${nextMessageAt.toISOString()}`);
          results.push({ enrollmentId: enrollment.id, status: 'advanced', smsSent });
        } else {
          // No more steps, complete the enrollment
          await supabase
            .from('sms_campaign_enrollments')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              next_message_at: null,
            })
            .eq('id', enrollment.id);

          console.log(`[sms-processor] Enrollment ${enrollment.id} completed`);
          results.push({ enrollmentId: enrollment.id, status: 'completed', smsSent });
        }

        // Update contact last_contacted_at
        if (enrollment.sms_conversations.contact_id && smsSent) {
          await supabase
            .from('contacts')
            .update({ last_contacted_at: new Date().toISOString() })
            .eq('id', enrollment.sms_conversations.contact_id);
        }

      } catch (err) {
        console.error(`[sms-processor] Error processing enrollment ${enrollment.id}:`, err);
        results.push({ enrollmentId: enrollment.id, status: 'error', error: String(err) });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      results,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[sms-processor] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
