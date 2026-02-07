import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InboundSmsPayload {
  from: string;
  to: string;
  body: string;
  // Retell-specific fields
  call_id?: string;
  retell_llm_dynamic_variables?: Record<string, string>;
}

// Call Lovable AI to generate agent response
async function generateAgentResponse(
  agentPrompt: string,
  conversationHistory: { role: string; content: string }[],
  leadContext: { name: string; service?: string; source?: string },
  businessName: string
): Promise<string> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  if (!lovableApiKey) {
    console.error('[sms-inbound] LOVABLE_API_KEY not configured');
    return "Thanks for your message! A team member will get back to you shortly.";
  }

  const systemPrompt = `${agentPrompt}

You are responding to a lead named ${leadContext.name || 'Customer'}. 
Business: ${businessName}
${leadContext.service ? `Service requested: ${leadContext.service}` : ''}
${leadContext.source ? `Lead source: ${leadContext.source}` : ''}

Keep your responses concise and suitable for SMS (under 160 characters if possible). Be helpful and professional.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
  ];

  try {
    const response = await fetch('https://ai.lovable.dev/api/v2/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 256,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[sms-inbound] AI API error:', errorText);
      throw new Error(`AI API returned ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Thanks for your message! We'll be in touch soon.";
  } catch (error) {
    console.error('[sms-inbound] Error calling AI:', error);
    return "Thanks for your message! A team member will get back to you shortly.";
  }
}

Deno.serve(async (req) => {
  console.log('[sms-inbound] Received inbound SMS');

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

    const body: InboundSmsPayload = await req.json();
    console.log('[sms-inbound] Payload:', JSON.stringify(body));

    if (!body.from || !body.body) {
      return new Response(JSON.stringify({ error: 'Missing required fields: from and body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalize phone number
    const normalizedPhone = body.from.replace(/\D/g, '').replace(/^1/, '');
    const e164Phone = `+1${normalizedPhone}`;

    // Find existing conversation by phone number
    const { data: conversations } = await supabase
      .from('sms_conversations')
      .select(`
        *,
        sms_agents!inner(id, name, prompt, personality, escalation_keywords, escalation_phone)
      `)
      .eq('lead_phone', e164Phone)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!conversations || conversations.length === 0) {
      console.log('[sms-inbound] No active conversation found for', e164Phone);
      return new Response(JSON.stringify({ 
        error: 'No active conversation found for this phone number',
        phone: e164Phone,
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const conversation = conversations[0];
    const agent = conversation.sms_agents;
    const userId = conversation.user_id;

    console.log('[sms-inbound] Found conversation:', conversation.id, 'with agent:', agent.name);

    // 1. Record the inbound message
    const { data: inboundMsg } = await supabase.from('sms_messages').insert({
      conversation_id: conversation.id,
      sender_type: 'lead',
      content: body.body,
      metadata: { from: body.from, to: body.to },
    }).select().single();

    console.log('[sms-inbound] Recorded inbound message:', inboundMsg?.id);

    // 2. Pause any active campaign enrollments for this conversation
    const { data: pausedEnrollments } = await supabase
      .from('sms_campaign_enrollments')
      .update({ 
        status: 'paused_by_reply',
        updated_at: new Date().toISOString(),
      })
      .eq('conversation_id', conversation.id)
      .eq('status', 'active')
      .select();

    if (pausedEnrollments && pausedEnrollments.length > 0) {
      console.log('[sms-inbound] Paused', pausedEnrollments.length, 'campaign enrollments');
    }

    // 3. Check for escalation keywords
    const escalationKeywords = agent.escalation_keywords || ['urgent', 'emergency', 'speak to human', 'real person', 'call me'];
    const messageText = body.body.toLowerCase();
    const shouldEscalate = escalationKeywords.some(keyword => 
      messageText.includes(keyword.toLowerCase())
    );

    if (shouldEscalate) {
      console.log('[sms-inbound] Escalation triggered');
      await supabase
        .from('sms_conversations')
        .update({
          is_escalated: true,
          escalated_at: new Date().toISOString(),
          escalation_reason: 'Keyword match in customer message',
        })
        .eq('id', conversation.id);

      // Send escalation response
      const escalationResponse = agent.escalation_phone 
        ? `I understand you'd like to speak with someone directly. Please call us at ${agent.escalation_phone} or a team member will reach out to you shortly.`
        : "I understand you'd like to speak with someone directly. A team member will reach out to you shortly.";

      await supabase.from('sms_messages').insert({
        conversation_id: conversation.id,
        sender_type: 'agent',
        content: escalationResponse,
        metadata: { escalation: true },
      });

      // Update conversation
      await supabase
        .from('sms_conversations')
        .update({
          last_message_at: new Date().toISOString(),
          message_count: (conversation.message_count || 0) + 2,
        })
        .eq('id', conversation.id);

      return new Response(JSON.stringify({
        success: true,
        action: 'escalated',
        response: escalationResponse,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Get conversation history for AI context
    const { data: messages } = await supabase
      .from('sms_messages')
      .select('sender_type, content, created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(20);

    const conversationHistory = (messages || []).map(m => ({
      role: m.sender_type === 'lead' ? 'user' : 'assistant',
      content: m.content,
    }));

    // 5. Get business profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name')
      .eq('user_id', userId)
      .single();

    // 6. Generate AI response
    const agentPrompt = agent.prompt || `You are a helpful ${agent.personality || 'friendly and professional'} customer service agent.`;
    
    const aiResponse = await generateAgentResponse(
      agentPrompt,
      conversationHistory,
      {
        name: conversation.lead_name || 'Customer',
        service: conversation.service_details,
        source: conversation.lead_source,
      },
      profile?.business_name || 'Our Business'
    );

    console.log('[sms-inbound] AI response:', aiResponse.substring(0, 50) + '...');

    // 7. Record the AI response
    await supabase.from('sms_messages').insert({
      conversation_id: conversation.id,
      sender_type: 'agent',
      content: aiResponse,
      metadata: { ai_generated: true },
    });

    // 8. Update conversation stats
    await supabase
      .from('sms_conversations')
      .update({
        last_message_at: new Date().toISOString(),
        message_count: (conversation.message_count || 0) + 2,
      })
      .eq('id', conversation.id);

    // 9. Update contact last_contacted_at
    if (conversation.contact_id) {
      await supabase
        .from('contacts')
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('id', conversation.contact_id);
    }

    // TODO: Actually send the SMS response via Retell API

    return new Response(JSON.stringify({
      success: true,
      action: 'responded',
      response: aiResponse,
      conversation_id: conversation.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[sms-inbound] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
