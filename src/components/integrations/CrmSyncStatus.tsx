import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowUpRight,
  Loader2 
} from 'lucide-react';
import { useCrmSync } from '@/hooks/useCrmSync';
import { useCrmConnections } from '@/hooks/useCrmConnections';
import { formatDistanceToNow } from 'date-fns';

interface CrmSyncStatusProps {
  entityType: 'sms_message' | 'call_log';
  entityId: string;
  showButton?: boolean;
  compact?: boolean;
}

export function CrmSyncStatus({ 
  entityType, 
  entityId, 
  showButton = true,
  compact = false 
}: CrmSyncStatusProps) {
  const { getLogsForEntity, syncMessage, syncCall } = useCrmSync();
  const { connections } = useCrmConnections();
  
  const logs = getLogsForEntity(entityId);
  const hasConnections = connections.some(c => c.is_active);
  
  const isSyncing = entityType === 'sms_message' 
    ? syncMessage.isPending 
    : syncCall.isPending;

  const handleSync = () => {
    if (entityType === 'sms_message') {
      syncMessage.mutate({ messageId: entityId });
    } else {
      syncCall.mutate({ callId: entityId });
    }
  };

  // Determine overall status
  const getOverallStatus = () => {
    if (logs.length === 0) return 'not_synced';
    if (logs.some(l => l.status === 'pending')) return 'pending';
    if (logs.every(l => l.status === 'success')) return 'success';
    if (logs.some(l => l.status === 'failed')) return 'partial';
    return 'success';
  };

  const status = getOverallStatus();
  const lastSync = logs[0];

  if (!hasConnections) {
    return null;
  }

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`cursor-help ${
              status === 'success' 
                ? 'bg-green-500/10 text-green-600 border-green-500/20'
                : status === 'partial'
                ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                : status === 'pending'
                ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {status === 'success' && <CheckCircle2 className="w-3 h-3 mr-1" />}
            {status === 'partial' && <XCircle className="w-3 h-3 mr-1" />}
            {status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
            {status === 'not_synced' && <ArrowUpRight className="w-3 h-3 mr-1" />}
            CRM
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {status === 'success' && 'Synced to all connected CRMs'}
          {status === 'partial' && 'Some CRM syncs failed'}
          {status === 'pending' && 'Sync in progress'}
          {status === 'not_synced' && 'Not synced to CRM yet'}
          {lastSync && (
            <p className="text-xs text-muted-foreground mt-1">
              Last: {formatDistanceToNow(new Date(lastSync.created_at), { addSuffix: true })}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="outline" 
        className={
          status === 'success' 
            ? 'bg-green-500/10 text-green-600 border-green-500/20'
            : status === 'partial'
            ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
            : status === 'pending'
            ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
            : 'bg-muted text-muted-foreground'
        }
      >
        {status === 'success' && <CheckCircle2 className="w-3 h-3 mr-1" />}
        {status === 'partial' && <XCircle className="w-3 h-3 mr-1" />}
        {status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
        {status === 'not_synced' && <ArrowUpRight className="w-3 h-3 mr-1" />}
        {status === 'success' && 'Synced'}
        {status === 'partial' && 'Partial'}
        {status === 'pending' && 'Syncing'}
        {status === 'not_synced' && 'Not synced'}
      </Badge>

      {showButton && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isSyncing ? 'Syncing...' : 'Sync to CRM'}
          </TooltipContent>
        </Tooltip>
      )}

      {lastSync && (
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(lastSync.created_at), { addSuffix: true })}
        </span>
      )}
    </div>
  );
}
