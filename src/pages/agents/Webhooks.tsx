import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
  Webhook,
  Copy,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Key,
} from "lucide-react";

const WEBHOOK_BASE_URL = window.location.origin;

interface WebhookLogEntry {
  id: string;
  userId: string | null;
  source: string;
  eventType: string;
  payload: any;
  status: string;
  contactId: string | null;
  errorMessage: string | null;
  isTest: boolean;
  createdAt: string;
}

interface WebhookSecretEntry {
  id: string;
  userId: string;
  source: string;
  secretKey: string;
  isActive: boolean;
  createdAt: string;
}

const SAMPLE_PAYLOADS: Record<string, any> = {
  angi: {
    first_name: "Sarah",
    last_name: "Johnson",
    phone_number: "555-867-5309",
    email: "sarah.johnson@email.com",
    postal_code: "92101",
    address: "123 Oak Street, San Diego, CA 92101",
    category: "plumbing",
    task_name: "Water Heater Repair",
    comments: "My water heater is making strange noises and not heating properly. Need someone to come take a look. House is about 15 years old.",
    spid: "12345678",
  },
  "google-lsa": {
    lead_id: "LSA-2026-" + Math.random().toString(36).substring(7),
    campaign_id: 987654321,
    adgroup_id: 0,
    creative_id: 0,
    gcl_id: "CjwKCAtest123",
    user_column_data: [
      { column_name: "Full Name", string_value: "Mike Rivera", column_id: "FULL_NAME" },
      { column_name: "User Phone", string_value: "555-234-5678", column_id: "PHONE_NUMBER" },
      { column_name: "User Email", string_value: "mike.rivera@gmail.com", column_id: "EMAIL" },
    ],
    api_version: "1.0",
    form_id: 112233445,
    google_key: "test_verification_key",
  },
  thumbtack: {
    name: "Jessica Chen",
    phone: "555-345-6789",
    email: "jessica.chen@outlook.com",
    category: "House Cleaning",
    description: "Looking for bi-weekly house cleaning service. 3 bedroom, 2 bath home, approximately 1800 sq ft.",
    zip_code: "90210",
  },
};

const WEBHOOK_SOURCES = [
  {
    source: "angi",
    label: "Angi",
    description: "Receives leads from Angi (formerly Angie's List / HomeAdvisor). Configure this URL in your Angi Business Center under webhook settings.",
    fields: "first_name, last_name, phone_number, email, postal_code, category, task_name, comments",
  },
  {
    source: "google-lsa",
    label: "Google LSA",
    description: "Receives leads from Google Local Services Ads. Supports the Google Ads Lead Form webhook format with user_column_data array.",
    fields: "lead_id, campaign_id, user_column_data (FULL_NAME, PHONE_NUMBER, EMAIL), google_key",
  },
  {
    source: "thumbtack",
    label: "Thumbtack",
    description: "Generic endpoint for Thumbtack or other lead sources. Accepts standard lead fields.",
    fields: "name, phone, email, category, description, zip_code",
  },
];

const Webhooks = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const { data: webhookLogs = [], isLoading: logsLoading } = useQuery<WebhookLogEntry[]>({
    queryKey: ["/api/webhook-logs"],
  });

  const { data: webhookSecrets = [], isLoading: secretsLoading } = useQuery<WebhookSecretEntry[]>({
    queryKey: ["/api/webhook-secrets"],
  });

  const createSecretMutation = useMutation({
    mutationFn: (source: string) => api.post<WebhookSecretEntry>("/api/webhook-secrets", { source }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/webhook-secrets"] });
      toast({ title: "Webhook key created", description: "Your new webhook key is ready to use." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create key", description: error.message, variant: "destructive" });
    },
  });

  const deleteSecretMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/webhook-secrets/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/webhook-secrets"] });
      toast({ title: "Webhook key deleted" });
    },
  });

  const sendTestMutation = useMutation({
    mutationFn: ({ source, payload }: { source: string; payload: any }) =>
      api.post<any>("/api/webhook-test", { source, payload }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["/api/webhook-logs"] });
      qc.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Test webhook sent", description: `${variables.source} test lead was received and processed.` });
    },
    onError: (error: Error) => {
      toast({ title: "Test failed", description: error.message, variant: "destructive" });
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard.` });
  };

  const getSecretForSource = (source: string) => {
    return webhookSecrets.find(s => s.source === source || s.source === "all");
  };

  const getWebhookUrl = (source: string) => {
    const secret = getSecretForSource(source);
    if (secret) {
      return `${WEBHOOK_BASE_URL}/api/webhooks/${source}?key=${secret.secretKey}`;
    }
    return `${WEBHOOK_BASE_URL}/api/webhooks/${source}?key=YOUR_KEY`;
  };

  return (
    <AgentLayout title="Webhooks" description="Receive and test incoming leads from Angi, Google LSA, and other sources">
      <Tabs defaultValue="endpoints" className="space-y-6">
        <TabsList data-testid="tabs-webhooks">
          <TabsTrigger value="endpoints" data-testid="tab-endpoints">Endpoints & Keys</TabsTrigger>
          <TabsTrigger value="test" data-testid="tab-test">Test Webhooks</TabsTrigger>
          <TabsTrigger value="logs" data-testid="tab-logs">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate a webhook key for each lead source, then copy the full URL into that service's webhook settings.
            Each key securely links incoming leads to your account.
          </p>

          {WEBHOOK_SOURCES.map((endpoint) => {
            const secret = getSecretForSource(endpoint.source);
            const fullUrl = getWebhookUrl(endpoint.source);
            return (
              <Card key={endpoint.source}>
                <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                      <Webhook className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{endpoint.label}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">POST endpoint</p>
                    </div>
                  </div>
                  {!secret ? (
                    <Button
                      onClick={() => createSecretMutation.mutate(endpoint.source)}
                      disabled={createSecretMutation.isPending}
                      data-testid={`button-generate-key-${endpoint.source}`}
                    >
                      {createSecretMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Key className="w-4 h-4 mr-2" />
                      )}
                      Generate Key
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => deleteSecretMutation.mutate(secret.id)}
                      disabled={deleteSecretMutation.isPending}
                      data-testid={`button-revoke-key-${endpoint.source}`}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Revoke Key
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-3 py-2 rounded-md text-xs font-mono break-all" data-testid={`text-webhook-url-${endpoint.source}`}>
                      {fullUrl}
                    </code>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(fullUrl, `${endpoint.label} webhook URL`)}
                      data-testid={`button-copy-url-${endpoint.source}`}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  {secret && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        <Key className="w-3 h-3 mr-1" />
                        Key active
                      </Badge>
                      <span className="text-xs text-muted-foreground">Created {new Date(secret.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  {!secret && (
                    <Badge variant="secondary">No key generated — webhook will reject requests</Badge>
                  )}
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Expected fields: </span>{endpoint.fields}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Send test webhooks to simulate incoming leads. A webhook key will be created automatically if needed.
            Test leads will appear in your Contacts and Activity Log.
          </p>
          {WEBHOOK_SOURCES.map((endpoint) => {
            const samplePayload = SAMPLE_PAYLOADS[endpoint.source];
            return (
              <Card key={endpoint.source}>
                <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
                  <div>
                    <CardTitle className="text-base">Test {endpoint.label} Lead</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Sends a sample lead payload to your webhook endpoint</p>
                  </div>
                  <Button
                    onClick={() => sendTestMutation.mutate({ source: endpoint.source, payload: samplePayload })}
                    disabled={sendTestMutation.isPending}
                    data-testid={`button-send-test-${endpoint.source}`}
                  >
                    {sendTestMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Send Test
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-md p-3 overflow-x-auto">
                    <pre className="text-xs font-mono whitespace-pre-wrap" data-testid={`text-sample-payload-${endpoint.source}`}>
                      {JSON.stringify(samplePayload, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-muted-foreground">
              Recent webhook activity showing incoming leads and their processing status.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => qc.invalidateQueries({ queryKey: ["/api/webhook-logs"] })}
              data-testid="button-refresh-logs"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {logsLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : webhookLogs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Webhook className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-medium mb-1">No webhook activity yet</h3>
                <p className="text-sm text-muted-foreground">Send a test webhook to see it appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {webhookLogs.map((log) => (
                <Card key={log.id} className="overflow-visible">
                  <CardContent className="p-4">
                    <div
                      className="flex items-center justify-between gap-3 cursor-pointer"
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      data-testid={`button-expand-log-${log.id}`}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        {expandedLog === log.id ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <Badge variant="outline">{log.source}</Badge>
                        {log.status === "processed" ? (
                          <Badge variant="default" data-testid="badge-status-processed"><CheckCircle className="w-3 h-3 mr-1" />Processed</Badge>
                        ) : log.status === "error" ? (
                          <Badge variant="destructive" data-testid="badge-status-error"><XCircle className="w-3 h-3 mr-1" />Error</Badge>
                        ) : (
                          <Badge variant="secondary" data-testid="badge-status-received"><Clock className="w-3 h-3 mr-1" />Received</Badge>
                        )}
                        {log.isTest && <Badge variant="outline">Test</Badge>}
                        <span className="text-sm font-medium">{log.eventType}</span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {expandedLog === log.id && (
                      <div className="mt-4 space-y-3">
                        {log.errorMessage && (
                          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                            {log.errorMessage}
                          </div>
                        )}
                        {log.contactId && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Contact created: </span>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded-md">{log.contactId}</code>
                          </div>
                        )}
                        <div className="bg-muted rounded-md p-3 overflow-x-auto">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Payload</p>
                          <pre className="text-xs font-mono whitespace-pre-wrap" data-testid={`text-log-payload-${log.id}`}>
                            {JSON.stringify(log.payload, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AgentLayout>
  );
};

export default Webhooks;
