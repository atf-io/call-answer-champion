import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

const QualityAssurance = () => {
  return (
    <AgentLayout
      title="AI Quality Assurance"
      description="Monitor and improve the quality of your AI agent interactions"
    >
      <div className="space-y-6">
        {/* QA Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Quality Settings</CardTitle>
            <CardDescription>
              Configure automated quality checks for your agents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-evaluate all calls</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically score calls using AI analysis
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Flag problematic calls</Label>
                <p className="text-sm text-muted-foreground">
                  Get alerts when calls score below threshold
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sentiment analysis</Label>
                <p className="text-sm text-muted-foreground">
                  Track customer sentiment throughout calls
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* QA Metrics */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Score</p>
                  <p className="text-2xl font-bold">N/A</p>
                </div>
                <ShieldCheck className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Flagged Calls</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Passed</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <CheckCircle className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <XCircle className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShieldCheck className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No QA data yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Quality assurance metrics will appear once your agents start handling calls
            </p>
            <Button variant="outline">Configure QA Rules</Button>
          </CardContent>
        </Card>
      </div>
    </AgentLayout>
  );
};

export default QualityAssurance;
