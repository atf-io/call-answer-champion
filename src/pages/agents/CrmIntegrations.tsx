import React, { useState } from 'react';
import AgentLayout from '@/components/agents/AgentLayout';
import { CrmConnectionCard } from '@/components/integrations/CrmConnectionCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeftRight, 
  Webhook, 
  Calendar,
  Info,
  RefreshCw
} from 'lucide-react';
import { useCrmConnections } from '@/hooks/useCrmConnections';
import { CRM_PROVIDERS, CRM_WEBHOOK_EVENTS } from '@/lib/crm/constants';
import { CrmType, CrmSyncSettings } from '@/lib/crm/types';

export default function CrmIntegrations() {
  const {
    connections,
    isLoading,
    initiateOAuth,
    disconnectCrm,
    toggleConnection,
    updateSyncSettings,
    getConnectionByType
  } = useCrmConnections();

  const [expandedSettings, setExpandedSettings] = useState<CrmType | null>(null);
  const [connectingCrm, setConnectingCrm] = useState<CrmType | null>(null);

  const handleConnect = async (crmType: CrmType) => {
    setConnectingCrm(crmType);
    try {
      await initiateOAuth.mutateAsync({
        crmType,
        redirectUri: `${window.location.origin}/dashboard/agents/crm-integrations`
      });
    } finally {
      setConnectingCrm(null);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    await disconnectCrm.mutateAsync(connectionId);
    setExpandedSettings(null);
  };

  const handleToggleActive = async (connectionId: string, isActive: boolean) => {
    await toggleConnection.mutateAsync({ connectionId, isActive });
  };

  const handleUpdateSettings = async (connectionId: string, settings: Partial<CrmSyncSettings>) => {
    await updateSyncSettings.mutateAsync({ connectionId, settings });
  };

  const connectedCount = connections.filter(c => c.access_token).length;

  return (
    <AgentLayout
      title="CRM Integrations"
      description="Connect your CRM to sync communications and enable scheduling"
    >
      <Tabs defaultValue="connections" className="space-y-6">
        <TabsList>
          <TabsTrigger value="connections" className="gap-2">
            <ArrowLeftRight className="w-4 h-4" />
            Connections
            {connectedCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {connectedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <Webhook className="w-4 h-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="scheduling" className="gap-2">
            <Calendar className="w-4 h-4" />
            Scheduling
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Bidirectional Sync</AlertTitle>
            <AlertDescription>
              Connect your CRM to automatically sync all SMS and call communications. 
              When customers are booked in your CRM, they'll be automatically removed from active campaigns.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CRM_PROVIDERS.map((provider) => {
              const connection = getConnectionByType(provider.id);
              return (
                <CrmConnectionCard
                  key={provider.id}
                  provider={provider}
                  connection={connection}
                  isConnecting={connectingCrm === provider.id}
                  onConnect={() => handleConnect(provider.id)}
                  onDisconnect={() => connection && handleDisconnect(connection.id)}
                  onToggleActive={(isActive) => connection && handleToggleActive(connection.id, isActive)}
                  onUpdateSettings={(settings) => connection && handleUpdateSettings(connection.id, settings)}
                  showSettings={expandedSettings === provider.id}
                  onToggleSettings={() => setExpandedSettings(
                    expandedSettings === provider.id ? null : provider.id
                  )}
                />
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Alert>
            <Webhook className="h-4 w-4" />
            <AlertTitle>CRM Event Webhooks</AlertTitle>
            <AlertDescription>
              When events occur in your connected CRM, VoiceHub will automatically react. 
              For example, when a job is booked, the customer will be removed from any active campaigns.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CRM_PROVIDERS.map((provider) => {
              const connection = getConnectionByType(provider.id);
              const events = CRM_WEBHOOK_EVENTS[provider.id];
              
              return (
                <Card key={provider.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: provider.color }}
                      >
                        {provider.name.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-base">{provider.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {connection ? 'Webhooks active' : 'Connect to enable'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {events.map((event, idx) => (
                        <div 
                          key={idx}
                          className={`flex items-start gap-2 p-2 rounded-lg text-sm ${
                            connection ? 'bg-muted/50' : 'opacity-50'
                          }`}
                        >
                          <Badge variant="outline" className="shrink-0 text-xs font-mono">
                            {event.event}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {event.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-6">
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertTitle>Dispatch Board Integration</AlertTitle>
            <AlertDescription>
              Configure scheduling to let AI agents book appointments directly into your CRM's dispatch board. 
              Set up business units, job types, and availability rules.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CRM_PROVIDERS.map((provider) => {
              const connection = getConnectionByType(provider.id);
              
              return (
                <Card key={provider.id} className={!connection ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: provider.color }}
                      >
                        {provider.name.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-base">{provider.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {connection ? 'Configure scheduling' : 'Connect first'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {connection ? (
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                          <p>Scheduling configuration will be available in Phase 4.</p>
                          <ul className="mt-2 space-y-1 list-disc list-inside">
                            <li>Business unit mapping</li>
                            <li>Job type configuration</li>
                            <li>Technician availability</li>
                            <li>Booking rules</li>
                          </ul>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <RefreshCw className="w-3 h-3" />
                          Coming soon
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Connect {provider.name} to configure scheduling integration.
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </AgentLayout>
  );
}
