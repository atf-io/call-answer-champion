// Retell.ai sync edge function - v2 API
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Retell has different base URLs for different endpoints
const RETELL_BASE_URL = "https://api.retellai.com/v2"; // For calls, agents
const RETELL_BASE_URL_V1 = "https://api.retellai.com"; // For phone numbers and other resources

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const RETELL_API_KEY = Deno.env.get("RETELL_API_KEY");
    if (!RETELL_API_KEY) {
      console.error("RETELL_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Retell API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action, agentId, limit = 100, area_code, nickname, inbound_agent_id, outbound_agent_id, agentConfig } = body;
    console.log(`Retell sync action: ${action} for user: ${user.id}`);

    let result;

    switch (action) {
      case "list-agents":
        result = await listRetellAgents(RETELL_API_KEY);
        break;

      case "list-calls":
        result = await listRetellCalls(RETELL_API_KEY, agentId, limit);
        break;

      case "get-call":
        result = await getRetellCall(RETELL_API_KEY, agentId);
        break;

      case "get-agent":
        result = await getRetellAgent(RETELL_API_KEY, agentId);
        break;

      case "create-agent":
        result = await createRetellAgent(RETELL_API_KEY, supabase, user.id, agentConfig);
        break;

      case "update-agent":
        result = await updateRetellAgent(RETELL_API_KEY, supabase, user.id, agentId, agentConfig);
        break;

      case "delete-agent":
        result = await deleteRetellAgent(RETELL_API_KEY, supabase, user.id, agentId);
        break;

      case "sync-calls":
        result = await syncCallsToDatabase(RETELL_API_KEY, supabase, user.id, agentId, limit);
        break;

      case "get-analytics":
        result = await getAnalytics(RETELL_API_KEY, supabase, user.id);
        break;

      case "get-live-status":
        result = await getLiveCallStatus(RETELL_API_KEY);
        break;

      case "list-phone-numbers":
        result = await listPhoneNumbers(RETELL_API_KEY);
        break;

      case "sync-phone-numbers":
        result = await syncPhoneNumbers(RETELL_API_KEY, supabase, user.id);
        break;

      case "purchase-phone-number":
        result = await purchasePhoneNumber(RETELL_API_KEY, supabase, user.id, area_code, nickname, inbound_agent_id, outbound_agent_id);
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Retell sync error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function listRetellAgents(apiKey: string) {
  console.log("Fetching Retell agents...");
  const response = await fetch(`${RETELL_BASE_URL}/list-voice-agent`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Retell API error:", response.status, errorText);
    throw new Error(`Failed to fetch agents: ${response.status}`);
  }

  const agents = await response.json();
  console.log(`Found ${agents.length} agents`);
  return { agents };
}

async function getRetellAgent(apiKey: string, agentId: string) {
  console.log(`Fetching Retell agent: ${agentId}`);
  const response = await fetch(`${RETELL_BASE_URL}/get-voice-agent/${agentId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Retell API error:", response.status, errorText);
    throw new Error(`Failed to fetch agent: ${response.status}`);
  }

  return await response.json();
}

async function listRetellCalls(apiKey: string, agentId?: string, limit: number = 100) {
  console.log(`Fetching Retell calls, agentId: ${agentId}, limit: ${limit}`);
  
  const body: any = {
    limit,
    sort_order: "descending",
  };

  if (agentId) {
    body.filter_criteria = [
      {
        member: ["agent_id"],
        operator: "contains",
        value: [agentId],
      },
    ];
  }

  const response = await fetch(`${RETELL_BASE_URL}/list-calls`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Retell API error:", response.status, errorText);
    throw new Error(`Failed to fetch calls: ${response.status}`);
  }

  const calls = await response.json();
  console.log(`Found ${calls.length} calls`);
  return { calls };
}

async function getRetellCall(apiKey: string, callId: string) {
  console.log(`Fetching Retell call: ${callId}`);
  const response = await fetch(`${RETELL_BASE_URL}/get-call/${callId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Retell API error:", response.status, errorText);
    throw new Error(`Failed to fetch call: ${response.status}`);
  }

  return await response.json();
}

async function syncCallsToDatabase(
  apiKey: string, 
  supabase: any, 
  userId: string, 
  agentId?: string,
  limit: number = 100
) {
  console.log(`Syncing calls to database for user: ${userId}`);
  
  // Fetch calls from Retell
  const { calls } = await listRetellCalls(apiKey, agentId, limit);

  // Get existing call IDs to avoid duplicates
  const { data: existingCalls } = await supabase
    .from("call_logs")
    .select("retell_call_id")
    .eq("user_id", userId);

  const existingIds = new Set(existingCalls?.map((c: any) => c.retell_call_id) || []);

  // Get user's agents to map retell_agent_id to our agent_id
  const { data: userAgents } = await supabase
    .from("ai_agents")
    .select("id, retell_agent_id")
    .eq("user_id", userId);

  const agentMap = new Map(userAgents?.map((a: any) => [a.retell_agent_id, a.id]) || []);

  // Helper to normalize sentiment to lowercase (constraint requires: positive, neutral, negative)
  const normalizeSentiment = (sentiment: string | null | undefined): string | null => {
    if (!sentiment) return null;
    const lower = sentiment.toLowerCase();
    if (['positive', 'neutral', 'negative'].includes(lower)) {
      return lower;
    }
    return null; // Unknown sentiment values become null
  };

  // Helper to normalize status (constraint requires: completed, voicemail, missed, failed)
  const normalizeStatus = (status: string | null | undefined): string => {
    if (!status) return "completed";
    const lower = status.toLowerCase();
    // Map Retell statuses to allowed values
    if (lower === "ended" || lower === "completed" || lower === "transferred") {
      return "completed";
    }
    if (lower === "voicemail") {
      return "voicemail";
    }
    if (lower === "missed" || lower === "no-answer" || lower === "busy") {
      return "missed";
    }
    if (lower === "failed" || lower === "error") {
      return "failed";
    }
    // Default unknown statuses to completed
    return "completed";
  };

  // Prepare new calls for insertion
  const newCalls = calls
    .filter((call: any) => !existingIds.has(call.call_id))
    .map((call: any) => ({
      user_id: userId,
      agent_id: agentMap.get(call.agent_id) || null,
      retell_call_id: call.call_id,
      caller_number: call.from_number || call.to_number || "Unknown",
      duration_seconds: Math.round((call.end_timestamp - call.start_timestamp) / 1000) || 0,
      status: normalizeStatus(call.call_status),
      transcript: call.transcript || null,
      sentiment: normalizeSentiment(call.call_analysis?.user_sentiment),
      created_at: new Date(call.start_timestamp).toISOString(),
    }));

  if (newCalls.length > 0) {
    const { error: insertError } = await supabase
      .from("call_logs")
      .insert(newCalls);

    if (insertError) {
      console.error("Error inserting calls:", insertError);
      throw new Error(`Failed to sync calls: ${insertError.message}`);
    }
    console.log(`Synced ${newCalls.length} new calls`);
  }

  // Update agent stats
  for (const [retellAgentId, dbAgentId] of agentMap) {
    const agentCalls = calls.filter((c: any) => c.agent_id === retellAgentId);
    if (agentCalls.length > 0) {
      const totalDuration = agentCalls.reduce((acc: number, c: any) => 
        acc + (Math.round((c.end_timestamp - c.start_timestamp) / 1000) || 0), 0);
      const avgDuration = Math.round(totalDuration / agentCalls.length);

      // Calculate satisfaction from sentiment
      const sentiments = agentCalls
        .map((c: any) => c.call_analysis?.user_sentiment)
        .filter(Boolean);
      const positiveCount = sentiments.filter((s: string) => 
        s === "Positive" || s === "positive").length;
      const satisfactionScore = sentiments.length > 0 
        ? Math.round((positiveCount / sentiments.length) * 100) 
        : 0;

      await supabase
        .from("ai_agents")
        .update({
          total_calls: agentCalls.length,
          avg_duration_seconds: avgDuration,
          satisfaction_score: satisfactionScore,
        })
        .eq("id", dbAgentId);
    }
  }

  return { 
    synced: newCalls.length, 
    total: calls.length,
    message: `Synced ${newCalls.length} new calls out of ${calls.length} total` 
  };
}

async function getAnalytics(apiKey: string, supabase: any, userId: string) {
  console.log(`Fetching analytics for user: ${userId}`);

  // Get aggregated stats from database
  const { data: callStats } = await supabase
    .from("call_logs")
    .select("duration_seconds, sentiment, status, created_at")
    .eq("user_id", userId);

  const { data: agents } = await supabase
    .from("ai_agents")
    .select("*")
    .eq("user_id", userId);

  const totalCalls = callStats?.length || 0;
  const totalDuration = callStats?.reduce((acc: number, c: any) => acc + (c.duration_seconds || 0), 0) || 0;
  const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
  
  const completedCalls = callStats?.filter((c: any) => c.status === "completed" || c.status === "ended").length || 0;
  const successRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;

  const positiveCount = callStats?.filter((c: any) => 
    c.sentiment === "Positive" || c.sentiment === "positive").length || 0;
  const satisfactionRate = totalCalls > 0 ? Math.round((positiveCount / totalCalls) * 100) : 0;

  // Get calls per day for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentCalls = callStats?.filter((c: any) => 
    new Date(c.created_at) >= thirtyDaysAgo) || [];

  const callsByDay: Record<string, number> = {};
  recentCalls.forEach((c: any) => {
    const day = new Date(c.created_at).toISOString().split("T")[0];
    callsByDay[day] = (callsByDay[day] || 0) + 1;
  });

  return {
    totalCalls,
    avgDurationSeconds: avgDuration,
    avgDurationFormatted: formatDuration(avgDuration),
    successRate,
    satisfactionRate,
    activeAgents: agents?.filter((a: any) => a.is_active).length || 0,
    totalAgents: agents?.length || 0,
    callsByDay,
    thisMonthCalls: recentCalls.length,
  };
}

async function getLiveCallStatus(apiKey: string) {
  console.log("Fetching live call status...");
  
  // Fetch recent calls to check for ongoing ones
  const response = await fetch(`${RETELL_BASE_URL}/list-calls`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      limit: 50,
      sort_order: "descending",
      filter_criteria: [
        {
          member: ["call_status"],
          operator: "contains",
          value: ["ongoing", "ringing"],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Retell API error:", response.status, errorText);
    // Return empty array instead of throwing for live status
    return { activeCalls: [], count: 0 };
  }

  const calls = await response.json();
  
  const activeCalls = calls.map((call: any) => ({
    callId: call.call_id,
    agentId: call.agent_id,
    status: call.call_status,
    startTime: call.start_timestamp,
    callerNumber: call.from_number || call.to_number || "Unknown",
  }));

  console.log(`Found ${activeCalls.length} active calls`);
  return { activeCalls, count: activeCalls.length };
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

async function listPhoneNumbers(apiKey: string) {
  console.log("Fetching Retell phone numbers...");
  // Phone numbers API uses base URL without /v2 prefix
  const response = await fetch(`${RETELL_BASE_URL_V1}/list-phone-numbers`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Retell API error:", response.status, errorText);
    throw new Error(`Failed to fetch phone numbers: ${response.status}`);
  }

  const phoneNumbers = await response.json();
  console.log(`Found ${phoneNumbers.length} phone numbers`);
  return { phoneNumbers };
}

async function syncPhoneNumbers(apiKey: string, supabase: any, userId: string) {
  console.log(`Syncing phone numbers for user: ${userId}`);
  
  // Fetch phone numbers from Retell
  const { phoneNumbers } = await listPhoneNumbers(apiKey);

  // Get existing phone number IDs to check for updates
  const { data: existingNumbers } = await supabase
    .from("phone_numbers")
    .select("id, retell_phone_number_id")
    .eq("user_id", userId);

  const existingMap = new Map(existingNumbers?.map((n: any) => [n.retell_phone_number_id, n.id]) || []);

  // Get user's agents to map retell_agent_id to our agent_id
  const { data: userAgents } = await supabase
    .from("ai_agents")
    .select("id, retell_agent_id")
    .eq("user_id", userId);

  const agentMap = new Map(userAgents?.map((a: any) => [a.retell_agent_id, a.id]) || []);

  let synced = 0;
  let updated = 0;

  for (const phone of phoneNumbers) {
    const phoneData = {
      user_id: userId,
      retell_phone_number_id: phone.phone_number_id,
      phone_number: phone.phone_number,
      nickname: phone.nickname || null,
      area_code: phone.area_code || null,
      inbound_agent_id: agentMap.get(phone.inbound_agent_id) || null,
      outbound_agent_id: agentMap.get(phone.outbound_agent_id) || null,
      is_active: true,
      last_synced_at: new Date().toISOString(),
    };

    if (existingMap.has(phone.phone_number_id)) {
      // Update existing
      const { error } = await supabase
        .from("phone_numbers")
        .update(phoneData)
        .eq("id", existingMap.get(phone.phone_number_id));
      
      if (!error) updated++;
    } else {
      // Insert new
      const { error } = await supabase
        .from("phone_numbers")
        .insert(phoneData);
      
      if (!error) synced++;
    }
  }

  console.log(`Synced ${synced} new, updated ${updated} phone numbers`);
  return { 
    synced, 
    updated,
    total: phoneNumbers.length,
    message: `Synced ${synced} new and updated ${updated} phone numbers` 
  };
}

async function purchasePhoneNumber(
  apiKey: string, 
  supabase: any, 
  userId: string,
  areaCode?: string,
  nickname?: string,
  inboundAgentId?: string,
  outboundAgentId?: string
) {
  console.log(`Purchasing phone number for user: ${userId}, area code: ${areaCode}`);
  
  // Build request body for Retell API
  const requestBody: any = {};
  
  if (areaCode) {
    // Retell API requires area_code as an integer
    requestBody.area_code = parseInt(areaCode, 10);
  }
  if (nickname) {
    requestBody.nickname = nickname;
  }
  if (inboundAgentId) {
    // Get the retell_agent_id from our agent
    const { data: agent } = await supabase
      .from("ai_agents")
      .select("retell_agent_id")
      .eq("id", inboundAgentId)
      .eq("user_id", userId)
      .single();
    
    if (agent?.retell_agent_id) {
      requestBody.inbound_agent_id = agent.retell_agent_id;
    }
  }
  if (outboundAgentId) {
    const { data: agent } = await supabase
      .from("ai_agents")
      .select("retell_agent_id")
      .eq("id", outboundAgentId)
      .eq("user_id", userId)
      .single();
    
    if (agent?.retell_agent_id) {
      requestBody.outbound_agent_id = agent.retell_agent_id;
    }
  }

  // Call Retell API to create phone number
  const response = await fetch(`${RETELL_BASE_URL_V1}/create-phone-number`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Retell API error:", response.status, errorText);
    throw new Error(`Failed to purchase phone number: ${errorText}`);
  }

  const phoneData = await response.json();
  console.log("Purchased phone number:", phoneData);

  // Save to database
  const { data: savedPhone, error: insertError } = await supabase
    .from("phone_numbers")
    .insert({
      user_id: userId,
      retell_phone_number_id: phoneData.phone_number_id,
      phone_number: phoneData.phone_number,
      nickname: phoneData.nickname || nickname || null,
      area_code: phoneData.area_code || areaCode || null,
      inbound_agent_id: inboundAgentId || null,
      outbound_agent_id: outboundAgentId || null,
      is_active: true,
      last_synced_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error("Error saving phone number:", insertError);
    throw new Error(`Phone number purchased but failed to save: ${insertError.message}`);
  }

  return {
    success: true,
    phone_number: phoneData.phone_number,
    phone_number_id: phoneData.phone_number_id,
    saved: savedPhone,
    message: `Successfully purchased ${phoneData.phone_number}`,
  };
}

// Build Retell agent config from our database config
function buildRetellAgentConfig(config: any) {
  const retellConfig: any = {};

  // Voice configuration
  if (config.voice_id) {
    retellConfig.voice_id = config.voice_id;
  }
  if (config.voice_model) {
    retellConfig.voice_model = config.voice_model;
  }
  if (config.voice_temperature !== undefined && config.voice_temperature !== null) {
    retellConfig.voice_temperature = config.voice_temperature;
  }
  if (config.voice_speed !== undefined && config.voice_speed !== null) {
    retellConfig.voice_speed = config.voice_speed;
  }
  if (config.volume !== undefined && config.volume !== null) {
    retellConfig.volume = config.volume;
  }

  // Behavior configuration
  if (config.responsiveness !== undefined && config.responsiveness !== null) {
    retellConfig.responsiveness = config.responsiveness;
  }
  if (config.interruption_sensitivity !== undefined && config.interruption_sensitivity !== null) {
    retellConfig.interruption_sensitivity = config.interruption_sensitivity;
  }
  if (config.enable_backchannel !== undefined) {
    retellConfig.enable_backchannel = config.enable_backchannel;
  }
  if (config.backchannel_frequency !== undefined && config.backchannel_frequency !== null) {
    retellConfig.backchannel_frequency = config.backchannel_frequency;
  }

  // Ambient sound - only set if not "none"
  if (config.ambient_sound && config.ambient_sound !== "none") {
    retellConfig.ambient_sound = config.ambient_sound;
    if (config.ambient_sound_volume !== undefined && config.ambient_sound_volume !== null) {
      retellConfig.ambient_sound_volume = config.ambient_sound_volume;
    }
  }

  // Language
  if (config.language) {
    retellConfig.language = config.language;
  }

  // Call timing configuration
  if (config.begin_message_delay_ms !== undefined && config.begin_message_delay_ms !== null) {
    retellConfig.begin_message_delay_ms = config.begin_message_delay_ms;
  }
  if (config.end_call_after_silence_ms !== undefined && config.end_call_after_silence_ms !== null) {
    retellConfig.end_call_after_silence_ms = config.end_call_after_silence_ms;
  }
  if (config.max_call_duration_ms !== undefined && config.max_call_duration_ms !== null) {
    retellConfig.max_call_duration_ms = config.max_call_duration_ms;
  }

  // Voicemail detection
  if (config.enable_voicemail_detection !== undefined) {
    retellConfig.enable_voicemail_detection = config.enable_voicemail_detection;
    if (config.enable_voicemail_detection) {
      if (config.voicemail_message) {
        retellConfig.voicemail_message = config.voicemail_message;
      }
      if (config.voicemail_detection_timeout_ms !== undefined && config.voicemail_detection_timeout_ms !== null) {
        retellConfig.voicemail_detection_timeout_ms = config.voicemail_detection_timeout_ms;
      }
    }
  }

  // Speech normalization
  if (config.normalize_for_speech !== undefined) {
    retellConfig.normalize_for_speech = config.normalize_for_speech;
  }

  // Boosted keywords
  if (config.boosted_keywords && config.boosted_keywords.length > 0) {
    retellConfig.boosted_keywords = config.boosted_keywords;
  }

  // Reminder configuration
  if (config.reminder_trigger_ms !== undefined && config.reminder_trigger_ms !== null) {
    retellConfig.reminder_trigger_ms = config.reminder_trigger_ms;
  }
  if (config.reminder_max_count !== undefined && config.reminder_max_count !== null) {
    retellConfig.reminder_max_count = config.reminder_max_count;
  }

  // Agent name
  if (config.name) {
    retellConfig.agent_name = config.name;
  }

  return retellConfig;
}

async function createRetellAgent(
  apiKey: string,
  supabase: any,
  userId: string,
  agentConfig: any
) {
  console.log(`Creating Retell agent for user: ${userId}`);
  console.log("Agent config:", JSON.stringify(agentConfig, null, 2));

  // Build Retell API payload
  const retellPayload = buildRetellAgentConfig(agentConfig);

  // Retell requires a response engine - create a basic LLM
  const llmResponse = await fetch(`${RETELL_BASE_URL}/create-retell-llm`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      general_prompt: `You are ${agentConfig.name || "an AI assistant"}. Your personality is ${agentConfig.personality || "friendly and professional"}. ${agentConfig.greeting_message ? `Start conversations with: "${agentConfig.greeting_message}"` : ""}`,
      begin_message: agentConfig.greeting_message || "Hello! How can I help you today?",
    }),
  });

  if (!llmResponse.ok) {
    const errorText = await llmResponse.text();
    console.error("Failed to create LLM:", errorText);
    throw new Error(`Failed to create LLM: ${errorText}`);
  }

  const llmData = await llmResponse.json();
  console.log("Created LLM:", llmData.llm_id);
  
  retellPayload.response_engine = {
    type: "retell-llm",
    llm_id: llmData.llm_id,
  };

  console.log("Creating Retell agent with payload:", JSON.stringify(retellPayload, null, 2));

  // Create the voice agent in Retell
  const response = await fetch(`${RETELL_BASE_URL}/create-voice-agent`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(retellPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to create Retell agent:", response.status, errorText);
    throw new Error(`Failed to create Retell agent: ${errorText}`);
  }

  const retellAgent = await response.json();
  console.log("Created Retell agent:", retellAgent.agent_id);

  // Save to database with retell_agent_id
  const { data: savedAgent, error: insertError } = await supabase
    .from("ai_agents")
    .insert({
      user_id: userId,
      retell_agent_id: retellAgent.agent_id,
      name: agentConfig.name,
      voice_type: agentConfig.voice_type || "Professional",
      personality: agentConfig.personality,
      greeting_message: agentConfig.greeting_message,
      schedule_start: agentConfig.schedule_start,
      schedule_end: agentConfig.schedule_end,
      schedule_days: agentConfig.schedule_days,
      voice_id: agentConfig.voice_id,
      voice_model: agentConfig.voice_model,
      voice_temperature: agentConfig.voice_temperature,
      voice_speed: agentConfig.voice_speed,
      volume: agentConfig.volume,
      responsiveness: agentConfig.responsiveness,
      interruption_sensitivity: agentConfig.interruption_sensitivity,
      enable_backchannel: agentConfig.enable_backchannel,
      backchannel_frequency: agentConfig.backchannel_frequency,
      ambient_sound: agentConfig.ambient_sound === "none" ? null : agentConfig.ambient_sound,
      ambient_sound_volume: agentConfig.ambient_sound_volume,
      language: agentConfig.language,
      enable_voicemail_detection: agentConfig.enable_voicemail_detection,
      voicemail_message: agentConfig.voicemail_message,
      voicemail_detection_timeout_ms: agentConfig.voicemail_detection_timeout_ms,
      max_call_duration_ms: agentConfig.max_call_duration_ms,
      end_call_after_silence_ms: agentConfig.end_call_after_silence_ms,
      begin_message_delay_ms: agentConfig.begin_message_delay_ms,
      normalize_for_speech: agentConfig.normalize_for_speech,
      boosted_keywords: agentConfig.boosted_keywords,
      reminder_trigger_ms: agentConfig.reminder_trigger_ms,
      reminder_max_count: agentConfig.reminder_max_count,
      is_active: true,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Error saving agent:", insertError);
    throw new Error(`Agent created in Retell but failed to save: ${insertError.message}`);
  }

  return {
    success: true,
    agent: savedAgent,
    retell_agent_id: retellAgent.agent_id,
    message: `Successfully created agent "${agentConfig.name}"`,
  };
}

async function updateRetellAgent(
  apiKey: string,
  supabase: any,
  userId: string,
  dbAgentId: string,
  agentConfig: any
) {
  console.log(`Updating Retell agent: ${dbAgentId} for user: ${userId}`);

  // Get the existing agent to find the retell_agent_id
  const { data: existingAgent, error: fetchError } = await supabase
    .from("ai_agents")
    .select("*")
    .eq("id", dbAgentId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !existingAgent) {
    throw new Error("Agent not found");
  }

  // If agent has a Retell ID, update it in Retell
  if (existingAgent.retell_agent_id) {
    const retellPayload = buildRetellAgentConfig(agentConfig);
    
    console.log("Updating Retell agent with payload:", JSON.stringify(retellPayload, null, 2));

    const response = await fetch(`${RETELL_BASE_URL}/update-voice-agent/${existingAgent.retell_agent_id}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(retellPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to update Retell agent:", response.status, errorText);
      console.log("Continuing with local database update...");
    } else {
      console.log("Retell agent updated successfully");
    }
  }

  // Update in database
  const { data: updatedAgent, error: updateError } = await supabase
    .from("ai_agents")
    .update({
      name: agentConfig.name ?? existingAgent.name,
      voice_type: agentConfig.voice_type ?? existingAgent.voice_type,
      personality: agentConfig.personality ?? existingAgent.personality,
      greeting_message: agentConfig.greeting_message ?? existingAgent.greeting_message,
      schedule_start: agentConfig.schedule_start ?? existingAgent.schedule_start,
      schedule_end: agentConfig.schedule_end ?? existingAgent.schedule_end,
      schedule_days: agentConfig.schedule_days ?? existingAgent.schedule_days,
      voice_id: agentConfig.voice_id ?? existingAgent.voice_id,
      voice_model: agentConfig.voice_model ?? existingAgent.voice_model,
      voice_temperature: agentConfig.voice_temperature ?? existingAgent.voice_temperature,
      voice_speed: agentConfig.voice_speed ?? existingAgent.voice_speed,
      volume: agentConfig.volume ?? existingAgent.volume,
      responsiveness: agentConfig.responsiveness ?? existingAgent.responsiveness,
      interruption_sensitivity: agentConfig.interruption_sensitivity ?? existingAgent.interruption_sensitivity,
      enable_backchannel: agentConfig.enable_backchannel ?? existingAgent.enable_backchannel,
      backchannel_frequency: agentConfig.backchannel_frequency ?? existingAgent.backchannel_frequency,
      ambient_sound: (agentConfig.ambient_sound === "none" ? null : agentConfig.ambient_sound) ?? existingAgent.ambient_sound,
      ambient_sound_volume: agentConfig.ambient_sound_volume ?? existingAgent.ambient_sound_volume,
      language: agentConfig.language ?? existingAgent.language,
      enable_voicemail_detection: agentConfig.enable_voicemail_detection ?? existingAgent.enable_voicemail_detection,
      voicemail_message: agentConfig.voicemail_message ?? existingAgent.voicemail_message,
      voicemail_detection_timeout_ms: agentConfig.voicemail_detection_timeout_ms ?? existingAgent.voicemail_detection_timeout_ms,
      max_call_duration_ms: agentConfig.max_call_duration_ms ?? existingAgent.max_call_duration_ms,
      end_call_after_silence_ms: agentConfig.end_call_after_silence_ms ?? existingAgent.end_call_after_silence_ms,
      begin_message_delay_ms: agentConfig.begin_message_delay_ms ?? existingAgent.begin_message_delay_ms,
      normalize_for_speech: agentConfig.normalize_for_speech ?? existingAgent.normalize_for_speech,
      boosted_keywords: agentConfig.boosted_keywords ?? existingAgent.boosted_keywords,
      reminder_trigger_ms: agentConfig.reminder_trigger_ms ?? existingAgent.reminder_trigger_ms,
      reminder_max_count: agentConfig.reminder_max_count ?? existingAgent.reminder_max_count,
      is_active: agentConfig.is_active ?? existingAgent.is_active,
    })
    .eq("id", dbAgentId)
    .select()
    .single();

  if (updateError) {
    console.error("Error updating agent:", updateError);
    throw new Error(`Failed to update agent: ${updateError.message}`);
  }

  return {
    success: true,
    agent: updatedAgent,
    message: `Successfully updated agent "${updatedAgent.name}"`,
  };
}

async function deleteRetellAgent(
  apiKey: string,
  supabase: any,
  userId: string,
  dbAgentId: string
) {
  console.log(`Deleting Retell agent: ${dbAgentId} for user: ${userId}`);

  // Get the existing agent to find the retell_agent_id
  const { data: existingAgent, error: fetchError } = await supabase
    .from("ai_agents")
    .select("retell_agent_id, name")
    .eq("id", dbAgentId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !existingAgent) {
    throw new Error("Agent not found");
  }

  // If agent has a Retell ID, delete it from Retell
  if (existingAgent.retell_agent_id) {
    const response = await fetch(`${RETELL_BASE_URL}/delete-voice-agent/${existingAgent.retell_agent_id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to delete Retell agent:", response.status, errorText);
    } else {
      console.log("Retell agent deleted successfully");
    }
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from("ai_agents")
    .delete()
    .eq("id", dbAgentId)
    .eq("user_id", userId);

  if (deleteError) {
    console.error("Error deleting agent:", deleteError);
    throw new Error(`Failed to delete agent: ${deleteError.message}`);
  }

  return {
    success: true,
    message: `Successfully deleted agent "${existingAgent.name}"`,
  };
}
