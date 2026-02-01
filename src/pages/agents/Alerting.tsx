import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Plus, Mail, MessageSquare, Webhook } from "lucide-react";

const Alerting = () => {
  return (
    <AgentLayout
      title="Alerting"
      description="Set up notifications for important events and thresholds"
    >
      <div className="space-y-6">
        {/* Alert Channels */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Channels</CardTitle>
            <CardDescription>
              Configure how you want to receive alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive alerts via email</p>
                </div>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive alerts via SMS</p>
                </div>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Webhook className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Webhook</p>
                  <p className="text-sm text-muted-foreground">Send alerts to custom endpoint</p>
                </div>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Alert Rules */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Alert Rules</CardTitle>
              <CardDescription>
                Create custom rules to trigger notifications
              </CardDescription>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <Bell className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No alert rules yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Create rules to get notified about failed calls, low satisfaction scores, or high call volumes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AgentLayout>
  );
};

export default Alerting;
