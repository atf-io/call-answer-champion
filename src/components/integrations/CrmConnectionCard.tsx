import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  Settings2,
  RefreshCw,
  Link2,
  Link2Off
} from 'lucide-react';
import { CrmProvider, CrmConnection, CrmSyncSettings } from '@/lib/crm/types';
import { formatDistanceToNow } from 'date-fns';

interface CrmConnectionCardProps {
  provider: CrmProvider;
  connection?: CrmConnection;
  isConnecting?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleActive: (isActive: boolean) => void;
  onUpdateSettings: (settings: Partial<CrmSyncSettings>) => void;
  showSettings?: boolean;
  onToggleSettings?: () => void;
}

export function CrmConnectionCard({
  provider,
  connection,
  isConnecting,
  onConnect,
  onDisconnect,
  onToggleActive,
  onUpdateSettings,
  showSettings,
  onToggleSettings
}: CrmConnectionCardProps) {
  const isConnected = !!connection?.access_token;
  const syncSettings = connection?.sync_settings as CrmSyncSettings | undefined;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: provider.color }}
            >
              {provider.name.charAt(0)}
            </div>
            <div>
              <CardTitle className="text-lg">{provider.name}</CardTitle>
              <CardDescription className="text-sm">
                {provider.description}
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant={isConnected ? "default" : "secondary"} 
            className="gap-1 shrink-0"
          >
            {isConnected ? (
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
        {isConnected ? (
          <>
            {/* Connection Info */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="outline" className={connection.is_active 
                  ? "bg-green-500/10 text-green-600 border-green-500/20" 
                  : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                }>
                  {connection.is_active ? 'Active' : 'Paused'}
                </Badge>
              </div>
              {connection.tenant_id && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Account ID</span>
                  <span className="text-sm font-mono">{connection.tenant_id}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connected</span>
                <span className="text-sm">
                  {formatDistanceToNow(new Date(connection.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Sync Toggle */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Sync Enabled</span>
              </div>
              <Switch 
                checked={connection.is_active}
                onCheckedChange={onToggleActive}
              />
            </div>

            {/* Settings Panel */}
            {showSettings && syncSettings && (
              <div className="space-y-3 pt-2 border-t">
                <Label className="text-sm font-medium">Sync Settings</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Sync SMS</span>
                    <Switch 
                      checked={syncSettings.sync_sms}
                      onCheckedChange={(checked) => onUpdateSettings({ sync_sms: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Sync Calls</span>
                    <Switch 
                      checked={syncSettings.sync_calls}
                      onCheckedChange={(checked) => onUpdateSettings({ sync_calls: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Auto Sync</span>
                    <Switch 
                      checked={syncSettings.auto_sync}
                      onCheckedChange={(checked) => onUpdateSettings({ auto_sync: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Sync Contacts</span>
                    <Switch 
                      checked={syncSettings.sync_contacts}
                      onCheckedChange={(checked) => onUpdateSettings({ sync_contacts: checked })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onToggleSettings}
              >
                <Settings2 className="w-4 h-4 mr-2" />
                {showSettings ? 'Hide Settings' : 'Settings'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onDisconnect}
                className="text-destructive hover:text-destructive"
              >
                <Link2Off className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
              <a 
                href={provider.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1 ml-auto"
              >
                Docs <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </>
        ) : (
          <>
            {/* Features List */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Features</Label>
              <ul className="space-y-1.5">
                {provider.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect Button */}
            <Button 
              onClick={onConnect}
              disabled={isConnecting}
              className="w-full"
              style={{ 
                backgroundColor: provider.color,
                borderColor: provider.color
              }}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 mr-2" />
                  Connect {provider.name}
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
