import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, Eye, EyeOff, RefreshCw, Webhook, CheckCircle2 } from 'lucide-react';
import { useCrmWebhooks } from '@/hooks/useCrmWebhooks';
import { useCrmConnections } from '@/hooks/useCrmConnections';
import type { CrmType } from '@/lib/crm/types';
import { CRM_CONFIGS } from '@/lib/crm/constants';
import { toast } from 'sonner';

export function CrmWebhookConfig() {
  const { connections } = useCrmConnections();
  const { 
    webhookSecrets, 
    isLoading, 
    generateWebhookUrl, 
    createWebhookSecret, 
    regenerateSecret,
    toggleWebhookActive,
    getSecretForCrm 
  } = useCrmWebhooks();
  
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null);

  const connectedCrms = connections.filter(c => c.is_active);

  const copyToClipboard = async (text: string, type: 'url' | 'secret', crmType: CrmType) => {
    await navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(crmType);
      setTimeout(() => setCopiedUrl(null), 2000);
    } else {
      setCopiedSecret(crmType);
      setTimeout(() => setCopiedSecret(null), 2000);
    }
    toast.success('Copied to clipboard');
  };

  const toggleSecretVisibility = (crmType: CrmType) => {
    setVisibleSecrets(prev => ({ ...prev, [crmType]: !prev[crmType] }));
  };

  if (isLoading) {
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />;
  }

  if (connectedCrms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            CRM Webhooks
          </CardTitle>
          <CardDescription>
            Connect a CRM first to configure webhooks for automatic campaign removal
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          CRM Webhooks
        </CardTitle>
        <CardDescription>
          Configure webhooks to automatically remove contacts from campaigns when jobs are booked in your CRM
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {connectedCrms.map(connection => {
          const crmType = connection.crm_type as CrmType;
          const config = CRM_CONFIGS[crmType];
          const secret = getSecretForCrm(crmType);
          const webhookUrl = generateWebhookUrl(crmType);
          const isSecretVisible = visibleSecrets[crmType];

          return (
            <div key={connection.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: config.color }}
                  >
                    {config.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-medium">{config.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {secret ? 'Webhook configured' : 'Not configured'}
                    </p>
                  </div>
                </div>
                {secret && (
                  <div className="flex items-center gap-2">
                    <Badge variant={secret.is_active ? 'default' : 'secondary'}>
                      {secret.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Switch
                      checked={secret.is_active}
                      onCheckedChange={(checked) => 
                        toggleWebhookActive.mutate({ secretId: secret.id, isActive: checked })
                      }
                    />
                  </div>
                )}
              </div>

              {!secret ? (
                <Button
                  onClick={() => createWebhookSecret.mutate({ crmType })}
                  disabled={createWebhookSecret.isPending}
                  className="w-full"
                >
                  Generate Webhook Secret
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={webhookUrl} 
                        readOnly 
                        className="font-mono text-xs"
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyToClipboard(webhookUrl, 'url', crmType)}
                            >
                              {copiedUrl === crmType ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy URL</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Add this URL to your {config.name} webhook settings
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Signing Secret</Label>
                    <div className="flex gap-2">
                      <Input 
                        type={isSecretVisible ? 'text' : 'password'}
                        value={secret.secret_key} 
                        readOnly 
                        className="font-mono text-xs"
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => toggleSecretVisibility(crmType)}
                            >
                              {isSecretVisible ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isSecretVisible ? 'Hide' : 'Show'} secret
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyToClipboard(secret.secret_key, 'secret', crmType)}
                            >
                              {copiedSecret === crmType ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy secret</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => regenerateSecret.mutate({ secretId: secret.id })}
                              disabled={regenerateSecret.isPending}
                            >
                              <RefreshCw className={`h-4 w-4 ${regenerateSecret.isPending ? 'animate-spin' : ''}`} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Regenerate secret</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Add this secret to your {config.name} webhook configuration for signature verification
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <p className="font-medium mb-2">Supported Events:</p>
                    <ul className="text-muted-foreground space-y-1 text-xs">
                      {crmType === 'jobber' && (
                        <>
                          <li>• JOB_CREATED - When a new job is created</li>
                          <li>• JOB_COMPLETED - When a job is marked complete</li>
                          <li>• INVOICE_CREATED - When an invoice is generated</li>
                        </>
                      )}
                      {crmType === 'servicetitan' && (
                        <>
                          <li>• Job.Created - When a new job is created</li>
                          <li>• Job.Scheduled - When a job is scheduled</li>
                          <li>• Job.Completed - When a job is completed</li>
                        </>
                      )}
                      {crmType === 'housecall_pro' && (
                        <>
                          <li>• job.created - When a new job is created</li>
                          <li>• job.scheduled - When a job is scheduled</li>
                          <li>• estimate.accepted - When an estimate is accepted</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
