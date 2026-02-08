import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  RefreshCw,
  Calendar,
  ArrowRightLeft,
  Settings2,
  Info,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useCrmConnections } from '@/hooks/useCrmConnections';
import { useJobberSchema } from '@/hooks/useJobberSchema';
import { CRM_CONFIGS } from '@/lib/crm/constants';
import type { 
  AgentCrmConfig, 
  CommunicationSettings, 
  SyncTriggers, 
  AgentSchedulingConfig,
  FieldMapping,
  CrmType,
  NoteDestination
} from '@/lib/crm/types';

interface AgentCrmSettingsProps {
  agentId: string;
  agentType: 'voice' | 'sms';
  config: AgentCrmConfig | null;
  onChange: (config: AgentCrmConfig) => void;
}

const DEFAULT_COMMUNICATION_SETTINGS: CommunicationSettings = {
  note_destinations: ['client_notes'],
  include_transcript: true,
  include_sentiment: true,
  note_prefix: '[VoiceHub]',
};

const NOTE_DESTINATION_OPTIONS: { value: NoteDestination; label: string; description: string }[] = [
  { value: 'client_notes', label: 'Client Notes', description: 'Add to client record notes' },
  { value: 'job_notes', label: 'Job Notes', description: 'Add to job/work order notes' },
  { value: 'request_notes', label: 'Request Notes', description: 'Add to service request notes' },
  { value: 'custom_field', label: 'Custom Field', description: 'Map to a specific custom field' },
];

const DEFAULT_SYNC_TRIGGERS: SyncTriggers = {
  on_message_sent: false,
  on_call_end: true,
  on_conversation_end: true,
  batch_sync_enabled: false,
  batch_sync_interval_minutes: 15,
};

const DEFAULT_SCHEDULING_CONFIG: AgentSchedulingConfig = {
  enabled: false,
  allowed_products_or_services: [],
  technician_assignment: 'any_available',
  allowed_technicians: [],
  service_window_hours: 4,
  require_confirmation: true,
  confirmation_message: "Great! I've scheduled your service for {date} at {time}. You'll receive a confirmation shortly.",
};

const VOICEHUB_FIELDS = [
  { id: 'lead_name', label: 'Lead Name' },
  { id: 'lead_phone', label: 'Phone Number' },
  { id: 'lead_email', label: 'Email' },
  { id: 'service_requested', label: 'Service Requested' },
  { id: 'address', label: 'Address' },
  { id: 'lead_source', label: 'Lead Source' },
  { id: 'notes', label: 'Conversation Notes' },
];

// Standard Jobber client fields (always available)
const JOBBER_STANDARD_FIELDS = [
  { id: 'first_name', name: 'First Name' },
  { id: 'last_name', name: 'Last Name' },
  { id: 'phone', name: 'Phone' },
  { id: 'email', name: 'Email' },
  { id: 'property_address', name: 'Property Address' },
  { id: 'notes', name: 'Notes' },
];

export function AgentCrmSettings({ agentId, agentType, config, onChange }: AgentCrmSettingsProps) {
  const { connections } = useCrmConnections();
  const activeConnections = connections.filter(c => c.is_active);
  
  // Get the current selected connection for fetching schema
  const selectedConnection = activeConnections.find(c => c.crm_type === (config?.crm_type || 'jobber'));
  const { 
    productsOrServices, 
    customFields, 
    teamMembers, 
    isLoading: isLoadingSchema,
    refetch: refetchSchema
  } = useJobberSchema(selectedConnection?.id);

  const [localConfig, setLocalConfig] = useState<AgentCrmConfig>(() => {
    if (config) return config;
    return {
      crm_type: 'jobber',
      is_enabled: false,
      communication_settings: DEFAULT_COMMUNICATION_SETTINGS,
      sync_triggers: DEFAULT_SYNC_TRIGGERS,
      scheduling_config: DEFAULT_SCHEDULING_CONFIG,
      field_mapping: [],
    };
  });

  useEffect(() => {
    if (config) setLocalConfig(config);
  }, [config]);

  const handleUpdate = (updates: Partial<AgentCrmConfig>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    onChange(newConfig);
  };

  const handleCommunicationUpdate = (updates: Partial<CommunicationSettings>) => {
    handleUpdate({
      communication_settings: { ...localConfig.communication_settings, ...updates },
    });
  };

  const handleSyncUpdate = (updates: Partial<SyncTriggers>) => {
    handleUpdate({
      sync_triggers: { ...localConfig.sync_triggers, ...updates },
    });
  };

  const handleSchedulingUpdate = (updates: Partial<AgentSchedulingConfig>) => {
    handleUpdate({
      scheduling_config: { ...localConfig.scheduling_config, ...updates },
    });
  };

  const addFieldMapping = () => {
    const newMapping: FieldMapping = {
      voicehub_field: '',
      crm_field_id: '',
      crm_field_name: '',
      is_required: false,
    };
    handleUpdate({
      field_mapping: [...localConfig.field_mapping, newMapping],
    });
  };

  const updateFieldMapping = (index: number, updates: Partial<FieldMapping>) => {
    const newMappings = [...localConfig.field_mapping];
    newMappings[index] = { ...newMappings[index], ...updates };
    handleUpdate({ field_mapping: newMappings });
  };

  const removeFieldMapping = (index: number) => {
    handleUpdate({
      field_mapping: localConfig.field_mapping.filter((_, i) => i !== index),
    });
  };

  if (activeConnections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            CRM Settings
          </CardTitle>
          <CardDescription>
            Configure how this agent syncs with your CRM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Connect a CRM in the <a href="/dashboard/agents/crm-integrations" className="underline font-medium">CRM Integrations</a> page to enable agent-level CRM settings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const selectedCrmConfig = CRM_CONFIGS[localConfig.crm_type];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              CRM Settings
            </CardTitle>
            <CardDescription>
              Configure how this agent syncs with your CRM
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={localConfig.crm_type}
              onValueChange={(value: CrmType) => handleUpdate({ crm_type: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activeConnections.map(conn => {
                  const cfg = CRM_CONFIGS[conn.crm_type as CrmType];
                  return (
                    <SelectItem key={conn.id} value={conn.crm_type}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: cfg.color }}
                        />
                        {cfg.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Switch
              checked={localConfig.is_enabled}
              onCheckedChange={(checked) => handleUpdate({ is_enabled: checked })}
            />
            <Badge variant={localConfig.is_enabled ? 'default' : 'secondary'}>
              {localConfig.is_enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="communication" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="communication" className="gap-1.5">
              <MessageSquare className="h-4 w-4" />
              Communication
            </TabsTrigger>
            <TabsTrigger value="sync" className="gap-1.5">
              <RefreshCw className="h-4 w-4" />
              Sync Triggers
            </TabsTrigger>
            <TabsTrigger value="scheduling" className="gap-1.5">
              <Calendar className="h-4 w-4" />
              Scheduling
            </TabsTrigger>
            <TabsTrigger value="mapping" className="gap-1.5">
              <ArrowRightLeft className="h-4 w-4" />
              Field Mapping
            </TabsTrigger>
          </TabsList>

          {/* Communication Settings Tab */}
          <TabsContent value="communication" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label>Note Destinations</Label>
                  <p className="text-sm text-muted-foreground">
                    Select where {agentType === 'voice' ? 'call transcripts and' : ''} conversation logs will be saved in {selectedCrmConfig.name}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {NOTE_DESTINATION_OPTIONS.map((option) => {
                    const isSelected = localConfig.communication_settings.note_destinations.includes(option.value);
                    return (
                      <div
                        key={option.value}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          const current = localConfig.communication_settings.note_destinations;
                          const updated = isSelected
                            ? current.filter(d => d !== option.value)
                            : [...current, option.value];
                          handleCommunicationUpdate({ note_destinations: updated.length > 0 ? updated : ['client_notes'] });
                        }}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => {}}
                          className="mt-0.5"
                        />
                        <div>
                          <Label className="cursor-pointer font-medium">{option.label}</Label>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {localConfig.communication_settings.note_destinations.includes('custom_field') && (
                <div className="space-y-2">
                  <Label>Custom Field ID</Label>
                  <Input
                    value={localConfig.communication_settings.custom_field_id || ''}
                    onChange={(e) => handleCommunicationUpdate({ custom_field_id: e.target.value })}
                    placeholder="Enter custom field ID from Jobber"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Note Prefix</Label>
                <Input
                  value={localConfig.communication_settings.note_prefix}
                  onChange={(e) => handleCommunicationUpdate({ note_prefix: e.target.value })}
                  placeholder="[VoiceHub]"
                />
                <p className="text-sm text-muted-foreground">
                  Prefix added to all notes synced to {selectedCrmConfig.name}
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Include in Notes</h4>
                
                {agentType === 'voice' && (
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Call Transcript</Label>
                      <p className="text-sm text-muted-foreground">Include full call transcript in notes</p>
                    </div>
                    <Switch
                      checked={localConfig.communication_settings.include_transcript}
                      onCheckedChange={(checked) => handleCommunicationUpdate({ include_transcript: checked })}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sentiment Analysis</Label>
                    <p className="text-sm text-muted-foreground">Include AI-detected sentiment in notes</p>
                  </div>
                  <Switch
                    checked={localConfig.communication_settings.include_sentiment}
                    onCheckedChange={(checked) => handleCommunicationUpdate({ include_sentiment: checked })}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Sync Triggers Tab */}
          <TabsContent value="sync" className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium">Automatic Sync Events</h4>
              
              {agentType === 'sms' && (
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Label>On Message Sent</Label>
                    <p className="text-sm text-muted-foreground">Sync immediately after each message</p>
                  </div>
                  <Switch
                    checked={localConfig.sync_triggers.on_message_sent}
                    onCheckedChange={(checked) => handleSyncUpdate({ on_message_sent: checked })}
                  />
                </div>
              )}

              {agentType === 'voice' && (
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Label>On Call End</Label>
                    <p className="text-sm text-muted-foreground">Sync when call completes</p>
                  </div>
                  <Switch
                    checked={localConfig.sync_triggers.on_call_end}
                    onCheckedChange={(checked) => handleSyncUpdate({ on_call_end: checked })}
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label>On Conversation End</Label>
                  <p className="text-sm text-muted-foreground">Sync when conversation is completed or escalated</p>
                </div>
                <Switch
                  checked={localConfig.sync_triggers.on_conversation_end}
                  onCheckedChange={(checked) => handleSyncUpdate({ on_conversation_end: checked })}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Label>Batch Sync</Label>
                    <p className="text-sm text-muted-foreground">Periodically sync all pending items</p>
                  </div>
                  <Switch
                    checked={localConfig.sync_triggers.batch_sync_enabled}
                    onCheckedChange={(checked) => handleSyncUpdate({ batch_sync_enabled: checked })}
                  />
                </div>

                {localConfig.sync_triggers.batch_sync_enabled && (
                  <div className="space-y-2 pl-4">
                    <Label>Sync Interval (minutes)</Label>
                    <Select
                      value={String(localConfig.sync_triggers.batch_sync_interval_minutes)}
                      onValueChange={(value) => handleSyncUpdate({ batch_sync_interval_minutes: parseInt(value) })}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">Every 5 minutes</SelectItem>
                        <SelectItem value="15">Every 15 minutes</SelectItem>
                        <SelectItem value="30">Every 30 minutes</SelectItem>
                        <SelectItem value="60">Every hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Scheduling Tab */}
          <TabsContent value="scheduling" className="space-y-6">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label>Enable Scheduling</Label>
                <p className="text-sm text-muted-foreground">
                  Allow this agent to book services directly in {selectedCrmConfig.name}
                </p>
              </div>
              <Switch
                checked={localConfig.scheduling_config.enabled}
                onCheckedChange={(checked) => handleSchedulingUpdate({ enabled: checked })}
              />
            </div>

            {localConfig.scheduling_config.enabled && (
              <div className="space-y-4">
                {/* Products/Services from Jobber - Multi-select */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Products & Services</Label>
                      <p className="text-sm text-muted-foreground">
                        Select which services this agent can schedule
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => refetchSchema()}
                      disabled={isLoadingSchema}
                    >
                      {isLoadingSchema ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {isLoadingSchema ? (
                    <Skeleton className="h-32 w-full" />
                  ) : productsOrServices.length > 0 ? (
                    <div className="border rounded-lg">
                      <ScrollArea className="h-48">
                        <div className="p-3 space-y-2">
                          {productsOrServices.map(product => {
                            const isSelected = localConfig.scheduling_config.allowed_products_or_services.some(
                              p => p.id === product.id
                            );
                            return (
                              <div
                                key={product.id}
                                className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50"
                              >
                                <Checkbox
                                  id={`product-${product.id}`}
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    const current = localConfig.scheduling_config.allowed_products_or_services;
                                    if (checked) {
                                      handleSchedulingUpdate({
                                        allowed_products_or_services: [
                                          ...current,
                                          { id: product.id, name: product.name }
                                        ]
                                      });
                                    } else {
                                      handleSchedulingUpdate({
                                        allowed_products_or_services: current.filter(p => p.id !== product.id)
                                      });
                                    }
                                  }}
                                />
                                <label 
                                  htmlFor={`product-${product.id}`}
                                  className="flex-1 flex items-center justify-between cursor-pointer text-sm"
                                >
                                  <span>{product.name}</span>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {product.category.toLowerCase()}
                                    </Badge>
                                    {product.durationMinutes && (
                                      <Badge variant="secondary" className="text-xs">
                                        {product.durationMinutes}m
                                      </Badge>
                                    )}
                                  </div>
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                      {localConfig.scheduling_config.allowed_products_or_services.length > 0 && (
                        <div className="border-t px-3 py-2 bg-muted/30">
                          <span className="text-xs text-muted-foreground">
                            {localConfig.scheduling_config.allowed_products_or_services.length} selected
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        No products or services found in your Jobber account. Make sure you have products/services configured in Jobber, or click refresh to reload.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Team Member Assignment */}
                <div className="space-y-2">
                  <Label>Team Member Assignment</Label>
                  <Select
                    value={localConfig.scheduling_config.technician_assignment}
                    onValueChange={(value: AgentSchedulingConfig['technician_assignment']) => 
                      handleSchedulingUpdate({ technician_assignment: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any_available">Any Available Team Member</SelectItem>
                      <SelectItem value="round_robin">Round Robin</SelectItem>
                      <SelectItem value="specific">Specific Team Members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {localConfig.scheduling_config.technician_assignment === 'specific' && (
                  <div className="space-y-2 pl-4">
                    <Label>Select Team Members</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose which team members this agent can assign jobs to
                    </p>
                    {isLoadingSchema ? (
                      <Skeleton className="h-32 w-full" />
                    ) : teamMembers.filter(t => t.isActive).length > 0 ? (
                      <div className="border rounded-lg">
                        <ScrollArea className="h-40">
                          <div className="p-3 space-y-2">
                            {teamMembers.filter(t => t.isActive).map(member => {
                              const isSelected = localConfig.scheduling_config.allowed_technicians.some(
                                t => t.id === member.id
                              );
                              return (
                                <div
                                  key={member.id}
                                  className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50"
                                >
                                  <Checkbox
                                    id={`member-${member.id}`}
                                    checked={isSelected}
                                    onCheckedChange={(checked) => {
                                      const current = localConfig.scheduling_config.allowed_technicians;
                                      if (checked) {
                                        handleSchedulingUpdate({
                                          allowed_technicians: [
                                            ...current,
                                            { id: member.id, name: member.name }
                                          ]
                                        });
                                      } else {
                                        handleSchedulingUpdate({
                                          allowed_technicians: current.filter(t => t.id !== member.id)
                                        });
                                      }
                                    }}
                                  />
                                  <label 
                                    htmlFor={`member-${member.id}`}
                                    className="flex-1 cursor-pointer text-sm"
                                  >
                                    {member.name}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                        {localConfig.scheduling_config.allowed_technicians.length > 0 && (
                          <div className="border-t px-3 py-2 bg-muted/30">
                            <span className="text-xs text-muted-foreground">
                              {localConfig.scheduling_config.allowed_technicians.length} selected
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          No active team members found. Click refresh above to reload from Jobber.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Arrival Window (hours)</Label>
                  <Select
                    value={String(localConfig.scheduling_config.service_window_hours)}
                    onValueChange={(value) => handleSchedulingUpdate({ service_window_hours: parseInt(value) })}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 hours</SelectItem>
                      <SelectItem value="4">4 hours</SelectItem>
                      <SelectItem value="8">Full day (8 hours)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Time window offered to customers for technician arrival
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Label>Require Confirmation</Label>
                    <p className="text-sm text-muted-foreground">
                      Agent confirms service with customer before booking
                    </p>
                  </div>
                  <Switch
                    checked={localConfig.scheduling_config.require_confirmation}
                    onCheckedChange={(checked) => handleSchedulingUpdate({ require_confirmation: checked })}
                  />
                </div>

                {localConfig.scheduling_config.require_confirmation && (
                  <div className="space-y-2">
                    <Label>Confirmation Message</Label>
                    <Input
                      value={localConfig.scheduling_config.confirmation_message || ''}
                      onChange={(e) => handleSchedulingUpdate({ confirmation_message: e.target.value })}
                      placeholder="Great! I've scheduled your service for {date} at {time}..."
                    />
                    <p className="text-sm text-muted-foreground">
                      Use {'{date}'} and {'{time}'} as placeholders
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Field Mapping Tab */}
          <TabsContent value="mapping" className="space-y-6">
            <div className="flex items-center justify-between">
              <Alert className="flex-1">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Map VoiceHub fields to {selectedCrmConfig.name} fields to ensure data is synced correctly when creating or updating customers.
                </AlertDescription>
              </Alert>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => refetchSchema()}
                disabled={isLoadingSchema}
                className="ml-2"
              >
                {isLoadingSchema ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="space-y-4">
              {localConfig.field_mapping.map((mapping, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-lg border">
                  <Select
                    value={mapping.voicehub_field}
                    onValueChange={(value) => updateFieldMapping(index, { voicehub_field: value })}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="VoiceHub field" />
                    </SelectTrigger>
                    <SelectContent>
                      {VOICEHUB_FIELDS.map(field => (
                        <SelectItem key={field.id} value={field.id}>{field.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <ArrowRightLeft className="h-4 w-4 text-muted-foreground shrink-0" />

                  <Select
                    value={mapping.crm_field_id}
                    onValueChange={(value) => {
                      // Check standard fields first, then custom fields
                      const standardField = JOBBER_STANDARD_FIELDS.find(f => f.id === value);
                      const customField = customFields.find(f => f.id === value);
                      updateFieldMapping(index, { 
                        crm_field_id: value,
                        crm_field_name: standardField?.name || customField?.label || value,
                      });
                    }}
                  >
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder={`${selectedCrmConfig.name} field`} />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        Standard Fields
                      </div>
                      {JOBBER_STANDARD_FIELDS.map(field => (
                        <SelectItem key={field.id} value={field.id}>{field.name}</SelectItem>
                      ))}
                      {customFields.length > 0 && (
                        <>
                          <Separator className="my-1" />
                          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                            Custom Fields (from Jobber)
                          </div>
                          {customFields.map(field => (
                            <SelectItem key={field.id} value={field.id}>
                              <div className="flex items-center gap-2">
                                {field.label}
                                <Badge variant="outline" className="text-xs">
                                  {field.fieldType.toLowerCase()}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={mapping.is_required}
                      onCheckedChange={(checked) => updateFieldMapping(index, { is_required: checked })}
                    />
                    <Label className="text-sm">Required</Label>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFieldMapping(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addFieldMapping}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Field Mapping
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
