import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhoneCall, Upload, Play } from "lucide-react";

const BatchCall = () => {
  return (
    <AgentLayout
      title="Batch Call"
      description="Launch outbound calling campaigns to reach multiple leads"
    >
      <div className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Campaign Setup */}
          <Card>
            <CardHeader>
              <CardTitle>Create Campaign</CardTitle>
              <CardDescription>
                Set up a new batch calling campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input id="campaign-name" placeholder="e.g., January Lead Follow-up" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent">Select Agent</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="voice-1">Voice Agent - Sales</SelectItem>
                    <SelectItem value="speed-1">Speed to Lead Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">From Phone Number</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select phone number" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No numbers available</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Upload Contact List</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop a CSV file or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Required columns: name, phone
                  </p>
                </div>
              </div>

              <Button className="w-full" disabled>
                <Play className="w-4 h-4 mr-2" />
                Start Campaign
              </Button>
            </CardContent>
          </Card>

          {/* Campaign History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Campaigns</CardTitle>
              <CardDescription>
                View and manage your batch calling campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12">
                <PhoneCall className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Create your first batch calling campaign to reach multiple leads at once
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AgentLayout>
  );
};

export default BatchCall;
