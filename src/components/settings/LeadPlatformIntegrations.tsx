import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import angiLogo from "@/assets/integrations/angi.svg";
import homeadvisorLogo from "@/assets/integrations/homeadvisor.svg";

interface PlatformState {
  connected: boolean;
  loading: boolean;
  accountId: string;
}

const LeadPlatformIntegrations = () => {
  const [angi, setAngi] = useState<PlatformState>({ connected: false, loading: false, accountId: "" });
  const [thumbtack, setThumbtack] = useState<PlatformState>({ connected: false, loading: false, accountId: "" });
  const [homeadvisor, setHomeadvisor] = useState<PlatformState>({ connected: false, loading: false, accountId: "" });

  const handleConnect = async (
    platform: string,
    state: PlatformState,
    setState: React.Dispatch<React.SetStateAction<PlatformState>>
  ) => {
    if (!state.accountId.trim()) {
      toast.error(`Please enter your ${platform} account ID or email`);
      return;
    }
    setState({ ...state, loading: true });
    await new Promise(resolve => setTimeout(resolve, 1500));
    setState({ ...state, connected: true, loading: false });
    toast.success(`${platform} connected successfully!`);
  };

  const handleDisconnect = (
    platform: string,
    setState: React.Dispatch<React.SetStateAction<PlatformState>>
  ) => {
    setState({ connected: false, loading: false, accountId: "" });
    toast.success(`${platform} disconnected`);
  };

  const renderPlatformCard = (
    name: string,
    description: string,
    logo: string | React.ReactNode,
    state: PlatformState,
    setState: React.Dispatch<React.SetStateAction<PlatformState>>,
    externalUrl: string,
    inputPlaceholder: string,
    inputLabel: string,
    bgColor: string
  ) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center p-1.5`}>
              {typeof logo === "string" ? (
                <img src={logo} alt={name} className="w-full h-full object-contain" />
              ) : (
                logo
              )}
            </div>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <Badge variant={state.connected ? "default" : "secondary"} className="gap-1">
            {state.connected ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                Connected
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3" />
                Not Connected
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.connected ? (
          <>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Account</span>
                <span className="text-sm font-mono">{state.accountId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">This Month Leads</span>
                <span className="text-sm font-medium">{Math.floor(Math.random() * 30) + 5}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Leads
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDisconnect(name, setState)}>
                Disconnect
              </Button>
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1 ml-auto"
              >
                Open Dashboard <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="space-y-2">
              <Label>Enabled Features</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Auto-import leads</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Lead notifications</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">Speed-to-lead calls</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">AI lead qualification</span>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor={`${name.toLowerCase()}-account`}>{inputLabel}</Label>
              <Input
                id={`${name.toLowerCase()}-account`}
                placeholder={inputPlaceholder}
                value={state.accountId}
                onChange={(e) => setState({ ...state, accountId: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Find this in your{" "}
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {name} pro dashboard
                </a>
              </p>
            </div>
            <Button onClick={() => handleConnect(name, state, setState)} disabled={state.loading}>
              {state.loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                `Connect ${name}`
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Lead Aggregator Platforms</h3>
        <p className="text-sm text-muted-foreground">
          Connect to popular lead generation platforms to automatically import leads and trigger Speed-to-Lead calls
        </p>
      </div>

      {renderPlatformCard(
        "Angi",
        "Import leads from Angi (formerly Angie's List) and trigger instant callbacks",
        angiLogo,
        angi,
        setAngi,
        "https://pro.angi.com",
        "Enter your Angi Pro email",
        "Angi Pro Account Email",
        "bg-[#ff6153]/10"
      )}

      {renderPlatformCard(
        "Thumbtack",
        "Sync Thumbtack leads and respond instantly with AI-powered calls",
        <span className="text-lg font-bold text-[#009fd9]">T</span>,
        thumbtack,
        setThumbtack,
        "https://pro.thumbtack.com",
        "Enter your Thumbtack Pro email",
        "Thumbtack Pro Account Email",
        "bg-[#009fd9]/10"
      )}

      {renderPlatformCard(
        "HomeAdvisor",
        "Connect your HomeAdvisor pro account to auto-import leads",
        homeadvisorLogo,
        homeadvisor,
        setHomeadvisor,
        "https://pro.homeadvisor.com",
        "Enter your HomeAdvisor Pro ID",
        "HomeAdvisor Pro Account ID",
        "bg-[#f19200]/10"
      )}
    </div>
  );
};

export default LeadPlatformIntegrations;
