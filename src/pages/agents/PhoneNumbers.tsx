import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Phone, Search, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PhoneNumbers = () => {
  return (
    <AgentLayout
      title="Phone Numbers"
      description="Manage phone numbers for your AI agents"
    >
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search phone numbers..." className="pl-10" />
          </div>
          <Button className="ml-4">
            <Plus className="w-4 h-4 mr-2" />
            Add Phone Number
          </Button>
        </div>

        {/* Phone Number Options */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <Badge variant="secondary">Recommended</Badge>
              </div>
              <CardTitle className="text-lg">Purchase New Number</CardTitle>
              <CardDescription>
                Get a dedicated phone number for your AI agent with instant setup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Browse Available Numbers
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <ExternalLink className="w-6 h-6 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg">Import Existing Number</CardTitle>
              <CardDescription>
                Connect an existing phone number from Twilio or other providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Connect Number
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Phone className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No phone numbers yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Add a phone number to start receiving calls through your AI agents
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Number
            </Button>
          </CardContent>
        </Card>
      </div>
    </AgentLayout>
  );
};

export default PhoneNumbers;
