import { useState } from "react";
import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Key, Globe, Shield, Webhook, Zap, Check, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const AgentSettings = () => {
  const [zapierWebhookUrl, setZapierWebhookUrl] = useState("");
  const [isTestingZapier, setIsTestingZapier] = useState(false);
  const [zapierConnected, setZapierConnected] = useState(false);

  const handleSaveZapier = () => {
    if (!zapierWebhookUrl.trim()) {
      toast.error("Please enter your Zapier webhook URL");
      return;
    }
    setZapierConnected(true);
    toast.success("Zapier webhook saved successfully");
  };

  const handleTestZapier = async () => {
    if (!zapierWebhookUrl.trim()) {
      toast.error("Please enter your Zapier webhook URL first");
      return;
    }

    setIsTestingZapier(true);
    try {
      await fetch(zapierWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          event: "test",
          timestamp: new Date().toISOString(),
          message: "Test event from AI Agents platform",
        }),
      });

      toast.success("Test event sent! Check your Zap's history to confirm it was triggered.");
    } catch (error) {
      console.error("Error testing Zapier webhook:", error);
      toast.error("Failed to send test event. Please check the URL and try again.");
    } finally {
      setIsTestingZapier(false);
    }
  };

  return (
    <AgentLayout
      title="Settings"
      description="Configure your AI agents platform settings"
    >
      <Tabs defaultValue="api" className="space-y-6">
        <TabsList>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                API Configuration
              </CardTitle>
              <CardDescription>
                Manage your API keys and external service connections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="retell-key">Retell API Key</Label>
                <div className="flex gap-2">
                  <Input id="retell-key" type="password" placeholder="Enter your Retell API key" />
                  <Button variant="outline">Save</Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Required for voice agent functionality
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="twilio-key">Twilio API Key</Label>
                <div className="flex gap-2">
                  <Input id="twilio-key" type="password" placeholder="Enter your Twilio API key" />
                  <Button variant="outline">Save</Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Required for phone number provisioning
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="google-key">Google Places API Key</Label>
                <div className="flex gap-2">
                  <Input id="google-key" type="password" placeholder="Enter your Google API key" />
                  <Button variant="outline">Save</Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Required for review management features
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          {/* Zapier Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-500" />
                Zapier Integration
              </CardTitle>
              <CardDescription>
                Connect your AI agents to 5,000+ apps via Zapier
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zapier-webhook">Zapier Webhook URL</Label>
                <div className="flex gap-2">
                  <Input 
                    id="zapier-webhook" 
                    placeholder="https://hooks.zapier.com/hooks/catch/..." 
                    value={zapierWebhookUrl}
                    onChange={(e) => setZapierWebhookUrl(e.target.value)}
                  />
                  <Button variant="outline" onClick={handleSaveZapier}>
                    {zapierConnected ? <Check className="w-4 h-4" /> : "Save"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Create a Zap with a "Webhooks by Zapier" trigger to get your webhook URL
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleTestZapier}
                  disabled={isTestingZapier || !zapierWebhookUrl.trim()}
                >
                  {isTestingZapier ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    "Send Test Event"
                  )}
                </Button>
                <a 
                  href="https://zapier.com/app/zaps" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  Open Zapier <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">Events sent to Zapier:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>call.started</strong> - When an AI agent answers a call</li>
                  <li>• <strong>call.ended</strong> - When a call is completed</li>
                  <li>• <strong>lead.captured</strong> - When a new lead is captured</li>
                  <li>• <strong>appointment.booked</strong> - When an appointment is scheduled</li>
                  <li>• <strong>review.received</strong> - When a new review comes in</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Other Integrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Other Integrations
              </CardTitle>
              <CardDescription>
                Manage third-party integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Google Business Profile</p>
                  <p className="text-sm text-muted-foreground">Not connected</p>
                </div>
                <Button variant="outline">Connect</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">CRM Integration</p>
                  <p className="text-sm text-muted-foreground">Not connected</p>
                </div>
                <Button variant="outline">Connect</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Calendar Integration</p>
                  <p className="text-sm text-muted-foreground">Not connected</p>
                </div>
                <Button variant="outline">Connect</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>API Access Logs</Label>
                  <p className="text-sm text-muted-foreground">
                    Log all API requests for auditing
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>IP Whitelisting</Label>
                  <p className="text-sm text-muted-foreground">
                    Restrict API access to specific IPs
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="w-5 h-5" />
                Webhook Configuration
              </CardTitle>
              <CardDescription>
                Set up webhooks to receive real-time events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input id="webhook-url" placeholder="https://your-server.com/webhook" />
              </div>
              <div className="space-y-2">
                <Label>Events to Send</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Call Started</span>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Call Ended</span>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Lead Captured</span>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Appointment Booked</span>
                    <Switch />
                  </div>
                </div>
              </div>
              <Button>Save Webhook Configuration</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AgentLayout>
  );
};

export default AgentSettings;
