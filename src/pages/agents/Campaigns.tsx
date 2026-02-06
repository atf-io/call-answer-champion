import { useState, useEffect } from "react";
import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit,
  Clock,
  MessageSquare,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useSmsCampaigns, SmsCampaign, CampaignStep } from "@/hooks/useSmsCampaigns";
import { useSmsAgents } from "@/hooks/useSmsAgents";
import { formatDistanceToNow } from "date-fns";

type ViewMode = "list" | "detail";

const statusBadge = (campaign: SmsCampaign) => {
  if (campaign.is_active) {
    return (
      <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30" data-testid={`badge-status-${campaign.id}`}>
        <Play className="w-3 h-3 mr-1" />
        Active
      </Badge>
    );
  }
  if (campaign.steps && campaign.steps.length > 0) {
    return (
      <Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" data-testid={`badge-status-${campaign.id}`}>
        <Pause className="w-3 h-3 mr-1" />
        Paused
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" data-testid={`badge-status-${campaign.id}`}>
      Draft
    </Badge>
  );
};

const Campaigns = () => {
  const {
    campaigns,
    isLoading,
    fetchCampaignWithSteps,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    addStep,
    updateStep,
    deleteStep,
    isCreating,
    isUpdating,
    isDeleting,
  } = useSmsCampaigns();
  const { agents, isLoading: agentsLoading } = useSmsAgents();

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedCampaign, setSelectedCampaign] = useState<SmsCampaign | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAgentId, setNewAgentId] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editStepDelay, setEditStepDelay] = useState(0);
  const [editStepMessage, setEditStepMessage] = useState("");

  const [addStepOpen, setAddStepOpen] = useState(false);
  const [newStepDelay, setNewStepDelay] = useState(60);
  const [newStepMessage, setNewStepMessage] = useState("");

  const openCampaignDetail = async (campaign: SmsCampaign) => {
    setLoadingDetail(true);
    setViewMode("detail");
    try {
      const full = await fetchCampaignWithSteps(campaign.id);
      setSelectedCampaign(full);
    } catch {
      setSelectedCampaign(campaign);
    } finally {
      setLoadingDetail(false);
    }
  };

  const refreshSelected = async () => {
    if (!selectedCampaign) return;
    try {
      const full = await fetchCampaignWithSteps(selectedCampaign.id);
      setSelectedCampaign(full);
    } catch {}
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createCampaign({
      name: newName.trim(),
      description: newDescription.trim() || undefined,
      sms_agent_id: newAgentId || undefined,
    });
    setNewName("");
    setNewDescription("");
    setNewAgentId("");
    setCreateDialogOpen(false);
  };

  const handleToggleActive = async () => {
    if (!selectedCampaign) return;
    await updateCampaign(selectedCampaign.id, { is_active: !selectedCampaign.is_active });
    setSelectedCampaign({ ...selectedCampaign, is_active: !selectedCampaign.is_active });
  };

  const handleDelete = async () => {
    if (!selectedCampaign) return;
    await deleteCampaign(selectedCampaign.id);
    setDeleteDialogOpen(false);
    setSelectedCampaign(null);
    setViewMode("list");
  };

  const handleAddStep = async () => {
    if (!selectedCampaign || !newStepMessage.trim()) return;
    const stepOrder = (selectedCampaign.steps?.length ?? 0) + 1;
    await addStep({
      campaign_id: selectedCampaign.id,
      step_order: stepOrder,
      delay_minutes: newStepDelay,
      message_template: newStepMessage.trim(),
    });
    setNewStepDelay(60);
    setNewStepMessage("");
    setAddStepOpen(false);
    await refreshSelected();
  };

  const startEditStep = (step: CampaignStep) => {
    setEditingStepId(step.id);
    setEditStepDelay(step.delay_minutes);
    setEditStepMessage(step.message_template);
  };

  const handleSaveStep = async () => {
    if (!editingStepId) return;
    await updateStep(editingStepId, {
      delay_minutes: editStepDelay,
      message_template: editStepMessage,
    });
    setEditingStepId(null);
    await refreshSelected();
  };

  const handleDeleteStep = async (stepId: string) => {
    await deleteStep(stepId);
    await refreshSelected();
  };

  const goBackToList = () => {
    setViewMode("list");
    setSelectedCampaign(null);
    setEditingStepId(null);
  };

  if (isLoading) {
    return (
      <AgentLayout title="Campaigns">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" data-testid="loader-campaigns" />
        </div>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout title="Campaigns">
      {viewMode === "list" && (
        <div>
          <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <div>
              <p className="text-muted-foreground">Create and manage automated SMS campaigns</p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-campaign">
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </div>

          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Megaphone className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2" data-testid="text-campaigns-empty">No campaigns yet</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  Create automated SMS campaigns to engage with your contacts at scale.
                </p>
                <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-campaign-empty">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => (
                <Card
                  key={campaign.id}
                  className="cursor-pointer hover-elevate"
                  onClick={() => openCampaignDetail(campaign)}
                  data-testid={`card-campaign-${campaign.id}`}
                >
                  <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate" data-testid={`text-campaign-name-${campaign.id}`}>
                        {campaign.name}
                      </CardTitle>
                    </div>
                    {statusBadge(campaign)}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {campaign.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-campaign-desc-${campaign.id}`}>
                        {campaign.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1" data-testid={`text-campaign-steps-${campaign.id}`}>
                        <MessageSquare className="w-3 h-3" />
                        {campaign.steps?.length ?? 0} steps
                      </span>
                      <span className="flex items-center gap-1" data-testid={`text-campaign-date-${campaign.id}`}>
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode === "detail" && (
        <div>
          {loadingDetail ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" data-testid="loader-campaign-detail" />
            </div>
          ) : selectedCampaign ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 flex-wrap">
                <Button variant="ghost" size="icon" onClick={goBackToList} data-testid="button-back-to-list">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-xl font-semibold" data-testid="text-campaign-detail-name">
                  {selectedCampaign.name}
                </h2>
                <div className="flex items-center gap-2 ml-auto flex-wrap">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={selectedCampaign.is_active}
                      onCheckedChange={handleToggleActive}
                      data-testid="switch-campaign-active"
                    />
                    <span className="text-sm text-muted-foreground">
                      {selectedCampaign.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setDeleteDialogOpen(true)}
                    data-testid="button-delete-campaign"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {selectedCampaign.description && (
                <p className="text-muted-foreground" data-testid="text-detail-description">
                  {selectedCampaign.description}
                </p>
              )}

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle className="text-base">Campaign Steps</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => setAddStepOpen(true)}
                    data-testid="button-add-step"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Step
                  </Button>
                </CardHeader>
                <CardContent>
                  {(!selectedCampaign.steps || selectedCampaign.steps.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <MessageSquare className="w-10 h-10 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground" data-testid="text-no-steps">
                        No steps yet. Add your first step to build the campaign sequence.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedCampaign.steps
                        .sort((a, b) => a.step_order - b.step_order)
                        .map((step) => (
                          <div
                            key={step.id}
                            className="border rounded-md p-4 space-y-3"
                            data-testid={`step-${step.id}`}
                          >
                            {editingStepId === step.id ? (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium">Step {step.step_order}</span>
                                </div>
                                <div className="space-y-2">
                                  <Label>Delay (minutes)</Label>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={editStepDelay}
                                    onChange={(e) => setEditStepDelay(Number(e.target.value))}
                                    data-testid="input-edit-step-delay"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Message Template</Label>
                                  <Textarea
                                    value={editStepMessage}
                                    onChange={(e) => setEditStepMessage(e.target.value)}
                                    rows={3}
                                    data-testid="textarea-edit-step-message"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" onClick={handleSaveStep} disabled={isUpdating} data-testid="button-save-step">
                                    {isUpdating && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingStepId(null)} data-testid="button-cancel-edit-step">
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium" data-testid={`text-step-number-${step.id}`}>
                                      Step {step.step_order}
                                    </span>
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground" data-testid={`text-step-delay-${step.id}`}>
                                      <Clock className="w-3 h-3" />
                                      {step.delay_minutes} min delay
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => startEditStep(step)}
                                      data-testid={`button-edit-step-${step.id}`}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleDeleteStep(step.id)}
                                      data-testid={`button-delete-step-${step.id}`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-sm mt-2 whitespace-pre-wrap" data-testid={`text-step-message-${step.id}`}>
                                  {step.message_template}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
            <DialogDescription>
              Set up a new SMS campaign to engage with your contacts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name *</Label>
              <Input
                id="campaign-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Welcome Series"
                data-testid="input-campaign-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-description">Description</Label>
              <Textarea
                id="campaign-description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Describe the purpose of this campaign..."
                rows={3}
                data-testid="textarea-campaign-description"
              />
            </div>
            <div className="space-y-2">
              <Label>SMS Agent</Label>
              <Select value={newAgentId} onValueChange={setNewAgentId}>
                <SelectTrigger data-testid="select-sms-agent">
                  <SelectValue placeholder="Select an SMS agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} data-testid="button-cancel-create">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating || !newName.trim()}
              data-testid="button-confirm-create-campaign"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addStepOpen} onOpenChange={setAddStepOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Step</DialogTitle>
            <DialogDescription>
              Add a new message step to the campaign sequence.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="step-delay">Delay (minutes)</Label>
              <Input
                id="step-delay"
                type="number"
                min={0}
                value={newStepDelay}
                onChange={(e) => setNewStepDelay(Number(e.target.value))}
                data-testid="input-new-step-delay"
              />
              <p className="text-xs text-muted-foreground">
                Time to wait before sending this message after the previous step.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="step-message">Message Template</Label>
              <Textarea
                id="step-message"
                value={newStepMessage}
                onChange={(e) => setNewStepMessage(e.target.value)}
                placeholder="Type your message..."
                rows={4}
                data-testid="textarea-new-step-message"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStepOpen(false)} data-testid="button-cancel-add-step">
              Cancel
            </Button>
            <Button
              onClick={handleAddStep}
              disabled={!newStepMessage.trim()}
              data-testid="button-confirm-add-step"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedCampaign?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} data-testid="button-cancel-delete">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              data-testid="button-confirm-delete-campaign"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AgentLayout>
  );
};

export default Campaigns;
