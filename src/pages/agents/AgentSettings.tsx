import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Key, Globe, Shield, Webhook } from "lucide-react";

const AgentSettings = () => {
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Connected Services
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
