import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Retell SMS inbound payload format
interface RetellSmsInboundPayload {
  event: 'sms_inbound';
  sms_inbound: {
    from_number: string;
    to_number: string;
    message: string;
    agent_id?: string;
  };
}

// Legacy/generic inbound payload
interface GenericInboundPayload {
  from: string;
  to: string;
  body: string;
  call_id?: string;
  retell_llm_dynamic_variables?: Record<string, string>;
}

type InboundPayload = RetellSmsInboundPayload | GenericInboundPayload;

// Send SMS via Retell API using the v2/send-text endpoint
async function sendSmsViaRetell(
  fromNumber: string,
  toNumber: string,
  message: string,
  retellApiKey: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    console.log(`[sms-inbound] Sending SMS from ${fromNumber} to ${toNumber}`);
    
    // Use v2/send-text for sending messages in an existing conversation
    const response = await fetch('https://api.retellai.com/v2/send-text', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${retellApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from_number: fromNumber,
        to_number: toNumber,
        text: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[sms-inbound] Retell SMS error:', response.status, errorText);
      return { success: false, error: `Retell API error: ${response.status}` };
    }

    const result = await response.json();
    console.log('[sms-inbound] SMS sent successfully:', result);
    return { success: true, messageId: result.message_id };
  } catch (error) {
    console.error('[sms-inbound] Failed to send SMS:', error);
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

// Normalize phone number to E.164 format
function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('1') && digits.length === 11) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  return phone.startsWith('+') ? phone : `+${digits}`;
}

// Parse incoming payload (supports both Retell and generic formats)
function parsePayload(body: InboundPayload): { from: string; to: string; message: string } | null {
  // Check for Retell format
  if ('event' in body && body.event === 'sms_inbound' && body.sms_inbound) {
    return {
      from: body.sms_inbound.from_number,
      to: body.sms_inbound.to_number,
      message: body.sms_inbound.message,
    };
  }
  
  // Check for generic format
  if ('from' in body && 'body' in body) {
    return {
      from: body.from,
      to: body.to || '',
      message: body.body,
    };
  }
  
  return null;
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
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
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

// Analyze conversation and determine result
async function analyzeConversationResult(
  supabase: SupabaseClient,
  conversationId: string,
  messages: { sender_type: string; content: string }[]
): Promise<string> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  if (!lovableApiKey || messages.length < 4) {
    return 'pending'; // Not enough context to analyze
  }

  const conversationText = messages.map(m => 
    `${m.sender_type === 'lead' ? 'Customer' : 'Agent'}: ${m.content}`
  ).join('\n');

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `Analyze this customer service conversation and classify the outcome. Return ONLY one of these exact values:
- success: Appointment booked or goal achieved
- qualified: Lead is interested and qualified but no appointment yet
- unqualified: Lead is not a good fit for services
- escalated: Customer requested to speak with a human
- discarded: Customer opted out, spam, or irrelevant
- pending: Conversation still ongoing, unclear outcome

Consider: Did the customer show interest? Was an appointment mentioned? Did they ask for a callback or human? Did they say stop/unsubscribe?`
          },
          {
            role: 'user',
            content: conversationText
          }
        ],
        max_tokens: 20,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      return 'pending';
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.toLowerCase().trim() || 'pending';
    
    // Validate result is one of our expected values
    const validResults = ['success', 'qualified', 'unqualified', 'escalated', 'discarded', 'pending'];
    return validResults.includes(result) ? result : 'pending';
  } catch (error) {
    console.error('[sms-inbound] Error analyzing conversation:', error);
    return 'pending';
  }
}

// Check for opt-out keywords
function isOptOutMessage(message: string): boolean {
  const optOutKeywords = ['stop', 'unsubscribe', 'cancel', 'quit', 'end', 'opt out', 'optout'];
  const lowerMessage = message.toLowerCase().trim();
  return optOutKeywords.some(keyword => lowerMessage === keyword || lowerMessage.startsWith(keyword + ' '));
}

Deno.serve(async (req) => {
  console.log('[sms-inbound] Received inbound SMS webhook');

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
    const retellApiKey = Deno.env.get('RETELL_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: InboundPayload = await req.json();
    console.log('[sms-inbound] Payload:', JSON.stringify(body));

    // Parse payload (supports both Retell and generic formats)
    const parsed = parsePayload(body);
    if (!parsed) {
      console.error('[sms-inbound] Invalid payload format');
      return new Response(JSON.stringify({ error: 'Invalid payload format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { from, to, message } = parsed;
    
    if (!from || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields: from and message' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalize phone number
    const e164Phone = normalizePhoneNumber(from);
    console.log('[sms-inbound] Normalized phone:', e164Phone);

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

    // Get user's from number for sending responses
    const fromNumber = await getUserFromNumber(supabase, userId);
    const canSendSms = !!fromNumber && !!retellApiKey;

    // 1. Check for opt-out
    if (isOptOutMessage(message)) {
      console.log('[sms-inbound] Opt-out detected');
      
      // Record the opt-out message
      await supabase.from('sms_messages').insert({
        conversation_id: conversation.id,
        sender_type: 'lead',
        content: message,
        metadata: { from, to, opt_out: true },
      });

      // End the conversation
      await supabase
        .from('sms_conversations')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
          conversion_status: 'discarded',
        })
        .eq('id', conversation.id);

      // Cancel any active enrollments
      await supabase
        .from('sms_campaign_enrollments')
        .update({ 
          status: 'cancelled',
          completed_at: new Date().toISOString(),
        })
        .eq('conversation_id', conversation.id)
        .in('status', ['active', 'paused_by_reply']);

      return new Response(JSON.stringify({
        success: true,
        action: 'opted_out',
        conversation_id: conversation.id,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Record the inbound message
    const { data: inboundMsg } = await supabase.from('sms_messages').insert({
      conversation_id: conversation.id,
      sender_type: 'lead',
      content: message,
      metadata: { from, to },
    }).select().single();

    console.log('[sms-inbound] Recorded inbound message:', inboundMsg?.id);

    // 3. Pause any active campaign enrollments for this conversation
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

    // 4. Check for escalation keywords
    const escalationKeywords = agent.escalation_keywords || ['urgent', 'emergency', 'speak to human', 'real person', 'call me'];
    const messageText = message.toLowerCase();
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
          conversion_status: 'escalated',
        })
        .eq('id', conversation.id);

      const escalationResponse = agent.escalation_phone 
        ? `I understand you'd like to speak with someone directly. Please call us at ${agent.escalation_phone} or a team member will reach out to you shortly.`
        : "I understand you'd like to speak with someone directly. A team member will reach out to you shortly.";

      const { data: escalationMsg } = await supabase.from('sms_messages').insert({
        conversation_id: conversation.id,
        sender_type: 'agent',
        content: escalationResponse,
        metadata: { escalation: true },
      }).select().single();

      // Send escalation SMS
      let smsSent = false;
      let messageId: string | undefined;
      if (canSendSms) {
        const smsResult = await sendSmsViaRetell(fromNumber!, e164Phone, escalationResponse, retellApiKey!);
        smsSent = smsResult.success;
        messageId = smsResult.messageId;
        
        // Update delivery status
        if (escalationMsg) {
          await supabase.from('sms_messages').update({
            delivery_status: smsSent ? 'sent' : 'failed',
            delivery_error: smsResult.error,
            retell_message_id: messageId,
          }).eq('id', escalationMsg.id);
        }
      }

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
        sms_sent: smsSent,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Get conversation history for AI context
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

    // 6. Get business profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name')
      .eq('user_id', userId)
      .maybeSingle();

    // 7. Generate AI response
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

    // 8. Record the AI response
    const { data: responseMsg } = await supabase.from('sms_messages').insert({
      conversation_id: conversation.id,
      sender_type: 'agent',
      content: aiResponse,
      metadata: { ai_generated: true },
    }).select().single();

    // 9. Send SMS via Retell
    let smsSent = false;
    let messageId: string | undefined;
    if (canSendSms) {
      const smsResult = await sendSmsViaRetell(fromNumber!, e164Phone, aiResponse, retellApiKey!);
      smsSent = smsResult.success;
      messageId = smsResult.messageId;
      
      // Update delivery status
      if (responseMsg) {
        await supabase.from('sms_messages').update({
          delivery_status: smsSent ? 'sent' : 'failed',
          delivery_error: smsResult.error,
          delivered_at: smsSent ? new Date().toISOString() : null,
          retell_message_id: messageId,
        }).eq('id', responseMsg.id);
      }
      
      if (!smsResult.success) {
        console.error('[sms-inbound] Failed to send SMS response:', smsResult.error);
      }
    } else {
      console.log('[sms-inbound] SMS delivery not available:', { hasFromNumber: !!fromNumber, hasRetellKey: !!retellApiKey });
    }

    // 10. Update conversation stats
    const newMessageCount = (conversation.message_count || 0) + 2;
    await supabase
      .from('sms_conversations')
      .update({
        last_message_at: new Date().toISOString(),
        message_count: newMessageCount,
      })
      .eq('id', conversation.id);

    // 11. Analyze conversation result if we have enough messages
    if (newMessageCount >= 6) {
      const allMessages = await supabase
        .from('sms_messages')
        .select('sender_type, content')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });
      
      if (allMessages.data) {
        const result = await analyzeConversationResult(supabase, conversation.id, allMessages.data);
        if (result !== 'pending') {
          await supabase
            .from('sms_conversations')
            .update({ conversion_status: result })
            .eq('id', conversation.id);
          console.log('[sms-inbound] Updated conversation result to:', result);
        }
      }
    }

    // 12. Update contact last_contacted_at
    if (conversation.contact_id) {
      await supabase
        .from('contacts')
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('id', conversation.contact_id);
    }

    return new Response(JSON.stringify({
      success: true,
      action: 'responded',
      response: aiResponse,
      conversation_id: conversation.id,
      sms_sent: smsSent,
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
