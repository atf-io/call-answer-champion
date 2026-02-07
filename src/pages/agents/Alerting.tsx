import { useState } from "react";
import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Bell, 
  Plus, 
  Mail, 
  Webhook, 
  Trash2, 
  Loader2, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Settings2,
  TrendingUp,
  Pencil,
} from "lucide-react";
import { 
  useAlertRules, 
  METRIC_TYPES, 
  THRESHOLD_TYPES, 
  COMPARATORS, 
  EVALUATION_WINDOWS, 
  FREQUENCIES,
  DISCONNECTION_REASONS,
  CreateAlertRuleData,
  AlertRule,
} from "@/hooks/useAlertRules";
import { useAgents } from "@/hooks/useAgents";
import { formatDistanceToNow } from "date-fns";

const Alerting = () => {
  const { rules, incidents, loading, saving, createRule, updateRule, deleteRule, toggleRuleStatus, resolveIncident } = useAlertRules();
  const { agents } = useAgents();

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateAlertRuleData>({
    name: "",
    description: "",
    metric_type: "call_count",
    threshold_type: "absolute",
    threshold_value: 100,
    comparator: ">",
    evaluation_window: "1h",
    evaluation_frequency: "1h",
    email_recipients: [],
    webhook_url: "",
  });
  const [emailInput, setEmailInput] = useState("");

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      metric_type: "call_count",
      threshold_type: "absolute",
      threshold_value: 100,
      comparator: ">",
      evaluation_window: "1h",
      evaluation_frequency: "1h",
      email_recipients: [],
      webhook_url: "",
    });
    setEmailInput("");
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingRule(null);
    setCreateDialogOpen(true);
  };

  const openEditDialog = (rule: AlertRule) => {
    setFormData({
      name: rule.name,
      description: rule.description || "",
      metric_type: rule.metric_type,
      threshold_type: rule.threshold_type,
      threshold_value: rule.threshold_value,
      comparator: rule.comparator,
      evaluation_window: rule.evaluation_window,
      evaluation_frequency: rule.evaluation_frequency,
      agent_filter: rule.agent_filter || undefined,
      disconnection_reason_filter: rule.disconnection_reason_filter || undefined,
      error_code_filter: rule.error_code_filter || undefined,
      email_recipients: rule.email_recipients || [],
      webhook_url: rule.webhook_url || "",
    });
    setEmailInput("");
    setEditingRule(rule);
    setCreateDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingRule) {
      const success = await updateRule(editingRule.id, formData);
      if (success) {
        setCreateDialogOpen(false);
        setEditingRule(null);
      }
    } else {
      const result = await createRule(formData);
      if (result) {
        setCreateDialogOpen(false);
      }
    }
  };

  const handleDelete = async () => {
    if (deleteRuleId) {
      await deleteRule(deleteRuleId);
      setDeleteRuleId(null);
    }
  };

  const addEmail = () => {
    if (emailInput && emailInput.includes("@")) {
      setFormData(prev => ({
        ...prev,
        email_recipients: [...(prev.email_recipients || []), emailInput],
      }));
      setEmailInput("");
    }
  };

  const removeEmail = (email: string) => {
    setFormData(prev => ({
      ...prev,
      email_recipients: (prev.email_recipients || []).filter(e => e !== email),
    }));
  };

  const getAvailableFrequencies = (window: string) => {
    const windowConfig = EVALUATION_WINDOWS.find(w => w.id === window);
    return windowConfig?.frequencies || ["1h"];
  };

  const getMetricName = (metricType: string) => {
    return METRIC_TYPES.find(m => m.id === metricType)?.name || metricType;
  };

  const getComparatorSymbol = (comparator: string) => {
    const comp = COMPARATORS.find(c => c.id === comparator);
    return comp?.id || comparator;
  };

  const activeIncidents = incidents.filter(i => i.status !== "resolved");

  if (loading) {
    return (
      <AgentLayout title="Alerting" description="Loading...">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout
      title="Alerting"
      description="Monitor your voice AI operations with automatic notifications"
    >
      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rules" className="gap-2">
            <Settings2 className="w-4 h-4" />
            Alert Rules
            {rules.length > 0 && (
              <Badge variant="secondary" className="ml-1">{rules.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="incidents" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            Incidents
            {activeIncidents.length > 0 && (
              <Badge variant="destructive" className="ml-1">{activeIncidents.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Alert Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{rules.length}</p>
                    <p className="text-sm text-muted-foreground">Alert Rules</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{rules.filter(r => r.is_active).length}</p>
                    <p className="text-sm text-muted-foreground">Active Rules</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeIncidents.length}</p>
                    <p className="text-sm text-muted-foreground">Open Incidents</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <TrendingUp className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{incidents.length}</p>
                    <p className="text-sm text-muted-foreground">Total Incidents</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alert Rules List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Alert Rules</CardTitle>
                <CardDescription>
                  Create rules to get notified about failed calls, low satisfaction scores, or high call volumes
                </CardDescription>
              </div>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Bell className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No alert rules yet</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-4">
                    Create rules to monitor call volume, success rates, costs, and more
                  </p>
                  <Button onClick={openCreateDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Rule
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div 
                      key={rule.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={(checked) => toggleRuleStatus(rule.id, checked)}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{rule.name}</p>
                            <Badge variant={rule.is_active ? "default" : "secondary"}>
                              {rule.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {getMetricName(rule.metric_type)} {getComparatorSymbol(rule.comparator)} {rule.threshold_value}
                            {rule.threshold_type === "relative" ? "%" : ""} • 
                            Every {FREQUENCIES.find(f => f.id === rule.evaluation_frequency)?.name.replace("Every ", "") || rule.evaluation_frequency}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {rule.email_recipients && rule.email_recipients.length > 0 && (
                              <Badge variant="outline" className="gap-1 text-xs">
                                <Mail className="w-3 h-3" />
                                {rule.email_recipients.length} email{rule.email_recipients.length > 1 ? "s" : ""}
                              </Badge>
                            )}
                            {rule.webhook_url && (
                              <Badge variant="outline" className="gap-1 text-xs">
                                <Webhook className="w-3 h-3" />
                                Webhook
                              </Badge>
                            )}
                            {rule.last_triggered_at && (
                              <span className="text-xs text-muted-foreground">
                                Last triggered {formatDistanceToNow(new Date(rule.last_triggered_at), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(rule)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteRuleId(rule.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metrics Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Available Metrics</CardTitle>
              <CardDescription>Metrics you can monitor with alert rules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {METRIC_TYPES.map((metric) => (
                  <div key={metric.id} className="p-3 border rounded-lg">
                    <p className="font-medium text-sm">{metric.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Incidents</CardTitle>
              <CardDescription>
                Track when alert rules are triggered and resolved
              </CardDescription>
            </CardHeader>
            <CardContent>
              {incidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Activity className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No incidents yet</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    When alert rules are triggered, incidents will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incidents.map((incident) => {
                    const rule = rules.find(r => r.id === incident.alert_rule_id);
                    return (
                      <div 
                        key={incident.id}
                        className={`flex items-center justify-between p-4 border rounded-lg ${
                          incident.status === "resolved" ? "bg-muted/30" : "border-destructive/50 bg-destructive/5"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {incident.status === "resolved" ? (
                            <CheckCircle2 className="w-5 h-5 text-success" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{rule?.name || "Unknown Rule"}</p>
                              <Badge variant={incident.status === "resolved" ? "secondary" : "destructive"}>
                                {incident.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Value: {incident.current_value} (threshold: {incident.threshold_value})
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              Triggered {formatDistanceToNow(new Date(incident.triggered_at), { addSuffix: true })}
                              {incident.resolved_at && (
                                <span>• Resolved {formatDistanceToNow(new Date(incident.resolved_at), { addSuffix: true })}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {incident.status !== "resolved" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => resolveIncident(incident.id)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Rule Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Alert Rule" : "Create Alert Rule"}</DialogTitle>
            <DialogDescription>
              Configure when and how you want to be notified
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Rule Name</Label>
                <Input
                  id="name"
                  placeholder="High Call Volume Alert"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Alert when call volume spikes unexpectedly"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>

            {/* Metric Selection */}
            <div className="space-y-4">
              <h4 className="font-medium">Metric Configuration</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Metric</Label>
                  <Select
                    value={formData.metric_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, metric_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {METRIC_TYPES.map((metric) => (
                        <SelectItem key={metric.id} value={metric.id}>
                          {metric.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Threshold Type</Label>
                  <Select
                    value={formData.threshold_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, threshold_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {THRESHOLD_TYPES.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Comparator</Label>
                  <Select
                    value={formData.comparator}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, comparator: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPARATORS.map((comp) => (
                        <SelectItem key={comp.id} value={comp.id}>
                          {comp.name} ({comp.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Threshold Value</Label>
                  <Input
                    type="number"
                    value={formData.threshold_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, threshold_value: parseFloat(e.target.value) || 0 }))}
                  />
                  {formData.threshold_type === "relative" && (
                    <p className="text-xs text-muted-foreground">Percentage change from previous period</p>
                  )}
                </div>
              </div>
            </div>

            {/* Timing */}
            <div className="space-y-4">
              <h4 className="font-medium">Evaluation Timing</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Evaluation Window</Label>
                  <Select
                    value={formData.evaluation_window}
                    onValueChange={(value) => {
                      const availableFreqs = getAvailableFrequencies(value);
                      setFormData(prev => ({
                        ...prev,
                        evaluation_window: value,
                        evaluation_frequency: availableFreqs.includes(prev.evaluation_frequency) 
                          ? prev.evaluation_frequency 
                          : availableFreqs[availableFreqs.length - 1],
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVALUATION_WINDOWS.map((window) => (
                        <SelectItem key={window.id} value={window.id}>
                          {window.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Evaluation Frequency</Label>
                  <Select
                    value={formData.evaluation_frequency}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, evaluation_frequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.filter(f => getAvailableFrequencies(formData.evaluation_window).includes(f.id)).map((freq) => (
                        <SelectItem key={freq.id} value={freq.id}>
                          {freq.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Notification Channels */}
            <div className="space-y-4">
              <h4 className="font-medium">Notification Channels</h4>
              
              {/* Email */}
              <div className="space-y-2">
                <Label>Email Recipients</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEmail())}
                  />
                  <Button type="button" variant="outline" onClick={addEmail}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.email_recipients && formData.email_recipients.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.email_recipients.map((email) => (
                      <Badge key={email} variant="secondary" className="gap-1">
                        {email}
                        <button onClick={() => removeEmail(email)} className="ml-1 hover:text-destructive">
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Webhook */}
              <div className="space-y-2">
                <Label>Webhook URL (optional)</Label>
                <Input
                  type="url"
                  placeholder="https://your-server.com/webhook"
                  value={formData.webhook_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Receive POST requests when alerts trigger. Integrate with Slack, PagerDuty, or custom workflows.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name || !formData.metric_type}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editingRule ? "Save Changes" : "Create Rule"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRuleId} onOpenChange={() => setDeleteRuleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Alert Rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this alert rule and all associated incidents. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AgentLayout>
  );
};

export default Alerting;
