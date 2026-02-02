// Retell.ai sync edge function - v2 API
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const RETELL_BASE_URL = "https://api.retellai.com/v2";

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

    const { action, agentId, limit = 100 } = await req.json();
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
  const response = await fetch(`${RETELL_BASE_URL}/list-phone-numbers`, {
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
