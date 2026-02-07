import { useState } from "react";
import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit,
  Clock,
  Loader2,
  ArrowLeft,
  Copy,
} from "lucide-react";
import { useSmsCampaigns, SmsCampaign, CampaignStep } from "@/hooks/useSmsCampaigns";
import { useSmsAgents } from "@/hooks/useSmsAgents";
import VariableInserter from "@/components/campaigns/VariableInserter";
import CampaignCard from "@/components/campaigns/CampaignCard";
import CreateCampaignDialog from "@/components/campaigns/CreateCampaignDialog";
import EditCampaignDialog from "@/components/campaigns/EditCampaignDialog";
import AddStepDialog from "@/components/campaigns/AddStepDialog";
import DeleteCampaignDialog from "@/components/campaigns/DeleteCampaignDialog";

type ViewMode = "list" | "detail";

const minutesToDhm = (totalMinutes: number) => ({
  days: Math.floor(totalMinutes / 1440),
  hours: Math.floor((totalMinutes % 1440) / 60),
  minutes: totalMinutes % 60,
});

const dhmToMinutes = (days: number, hours: number, minutes: number) =>
  days * 1440 + hours * 60 + minutes;

const formatDelay = (totalMinutes: number) => {
  const { days, hours, minutes } = minutesToDhm(totalMinutes);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
  return parts.join(" ");
};

const stepToMinutes = (step: CampaignStep) =>
  (step.delay_days || 0) * 1440 + (step.delay_hours || 0) * 60;

const statusBadge = (campaign: SmsCampaign) => {
  if (campaign.is_active) {
    return (
      <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30">
        <Play className="w-3 h-3 mr-1" />
        Active
      </Badge>
    );
  }
  if (campaign.steps && campaign.steps.length > 0) {
    return (
      <Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">
        <Pause className="w-3 h-3 mr-1" />
        Paused
      </Badge>
    );
  }
  return <Badge variant="secondary">Draft</Badge>;
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
  const { agents } = useSmsAgents();

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedCampaign, setSelectedCampaign] = useState<SmsCampaign | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetCampaign, setDeleteTargetCampaign] = useState<SmsCampaign | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTargetCampaign, setEditTargetCampaign] = useState<SmsCampaign | null>(null);
  const [isCloning, setIsCloning] = useState(false);

  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editDelayDays, setEditDelayDays] = useState(0);
  const [editDelayHours, setEditDelayHours] = useState(0);
  const [editDelayMinutes, setEditDelayMinutes] = useState(0);
  const [editStepMessage, setEditStepMessage] = useState("");
  const [addStepOpen, setAddStepOpen] = useState(false);

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

  const handleToggleActive = async () => {
    if (!selectedCampaign) return;
    await updateCampaign(selectedCampaign.id, { is_active: !selectedCampaign.is_active });
    setSelectedCampaign({ ...selectedCampaign, is_active: !selectedCampaign.is_active });
  };

  const openDeleteDialog = (campaign: SmsCampaign) => {
    setDeleteTargetCampaign(campaign);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    const target = deleteTargetCampaign || selectedCampaign;
    if (!target) return;
    await deleteCampaign(target.id);
    setDeleteDialogOpen(false);
    setDeleteTargetCampaign(null);
    if (selectedCampaign?.id === target.id) {
      setSelectedCampaign(null);
      setViewMode("list");
    }
  };

  const openEditDialog = (campaign: SmsCampaign) => {
    setEditTargetCampaign(campaign);
    setEditDialogOpen(true);
  };

  const handleClone = async (campaign: SmsCampaign) => {
    setIsCloning(true);
    try {
      const fullCampaign = await fetchCampaignWithSteps(campaign.id);
      const cloned = await createCampaign({
        name: `${fullCampaign.name} (Copy)`,
        description: fullCampaign.description || undefined,
        sms_agent_id: fullCampaign.sms_agent_id || undefined,
        is_active: false,
      });
      if (cloned?.id && fullCampaign.steps?.length) {
        for (const step of fullCampaign.steps.sort((a, b) => a.step_order - b.step_order)) {
          await addStep({
            campaign_id: cloned.id,
            step_order: step.step_order,
            delay_minutes: stepToMinutes(step),
            message_template: step.message_template,
          });
        }
      }
    } finally {
      setIsCloning(false);
    }
  };

  const handleAddStep = async (data: {
    delay_days: number;
    delay_hours: number;
    delay_minutes: number;
    message_template: string;
  }) => {
    if (!selectedCampaign) return;
    const stepOrder = (selectedCampaign.steps?.length ?? 0) + 1;
    await addStep({
      campaign_id: selectedCampaign.id,
      step_order: stepOrder,
      delay_minutes: dhmToMinutes(data.delay_days, data.delay_hours, data.delay_minutes),
      message_template: data.message_template,
    });
    await refreshSelected();
  };

  const startEditStep = (step: CampaignStep) => {
    setEditingStepId(step.id);
    const dhm = minutesToDhm(stepToMinutes(step));
    setEditDelayDays(dhm.days);
    setEditDelayHours(dhm.hours);
    setEditDelayMinutes(dhm.minutes);
    setEditStepMessage(step.message_template);
  };

  const handleSaveStep = async () => {
    if (!editingStepId) return;
    await updateStep(editingStepId, {
      delay_minutes: dhmToMinutes(editDelayDays, editDelayHours, editDelayMinutes),
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
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onClick={() => openCampaignDetail(campaign)}
                  onEdit={() => openEditDialog(campaign)}
                  onClone={() => handleClone(campaign)}
                  onDelete={() => openDeleteDialog(campaign)}
                  isCloning={isCloning}
                />
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
                      checked={selectedCampaign.is_active ?? false}
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
                    onClick={() => openEditDialog(selectedCampaign)}
                    data-testid="button-edit-campaign-detail"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleClone(selectedCampaign)}
                    disabled={isCloning}
                    data-testid="button-clone-campaign-detail"
                  >
                    {isCloning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openDeleteDialog(selectedCampaign)}
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

              {selectedCampaign.lead_sources && selectedCampaign.lead_sources.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Lead Sources:</span>
                  {selectedCampaign.lead_sources.map((source) => (
                    <Badge key={source} variant="secondary" className="capitalize">
                      {source.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
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
                  {!selectedCampaign.steps || selectedCampaign.steps.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No steps yet. Add your first message step to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedCampaign.steps
                        .sort((a, b) => a.step_order - b.step_order)
                        .map((step) => (
                          <div
                            key={step.id}
                            className="border rounded-lg p-4"
                            data-testid={`step-card-${step.id}`}
                          >
                            {editingStepId === step.id ? (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Delay</Label>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Days</Label>
                                      <Input
                                        type="number"
                                        min={0}
                                        value={editDelayDays}
                                        onChange={(e) => setEditDelayDays(Number(e.target.value) || 0)}
                                        data-testid="input-edit-step-days"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Hours</Label>
                                      <Input
                                        type="number"
                                        min={0}
                                        max={23}
                                        value={editDelayHours}
                                        onChange={(e) => setEditDelayHours(Number(e.target.value) || 0)}
                                        data-testid="input-edit-step-hours"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Minutes</Label>
                                      <Input
                                        type="number"
                                        min={0}
                                        max={59}
                                        value={editDelayMinutes}
                                        onChange={(e) => setEditDelayMinutes(Number(e.target.value) || 0)}
                                        data-testid="input-edit-step-minutes"
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <Label>Message</Label>
                                    <VariableInserter
                                      onInsert={(v) =>
                                        setEditStepMessage((prev) => {
                                          if (prev.length === 0 || prev.endsWith(" ") || prev.endsWith("\n"))
                                            return prev + v;
                                          return prev + " " + v;
                                        })
                                      }
                                    />
                                  </div>
                                  <Textarea
                                    value={editStepMessage}
                                    onChange={(e) => setEditStepMessage(e.target.value)}
                                    rows={4}
                                    data-testid="textarea-edit-step-message"
                                  />
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingStepId(null)}
                                    data-testid="button-cancel-edit-step"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={handleSaveStep}
                                    data-testid="button-save-step"
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 text-sm font-medium">
                                    <span>Step {step.step_order}</span>
                                    <Badge variant="outline" className="font-normal">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {formatDelay(stepToMinutes(step))} delay
                                    </Badge>
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
                                <p
                                  className="text-sm mt-2 whitespace-pre-wrap"
                                  data-testid={`text-step-message-${step.id}`}
                                >
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

      <CreateCampaignDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        agents={agents}
        onCreateCampaign={createCampaign}
        onAddStep={addStep}
        isCreating={isCreating}
        onCampaignCreated={(campaign) => openCampaignDetail(campaign as SmsCampaign)}
      />

      <AddStepDialog
        open={addStepOpen}
        onOpenChange={setAddStepOpen}
        onAddStep={handleAddStep}
      />

      <EditCampaignDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditTargetCampaign(null);
        }}
        campaign={editTargetCampaign}
        agents={agents}
        onUpdateCampaign={updateCampaign}
        isUpdating={isUpdating}
        onCampaignUpdated={(updates) => {
          if (selectedCampaign?.id === editTargetCampaign?.id) {
            setSelectedCampaign({ ...selectedCampaign, ...updates });
          }
        }}
      />

      <DeleteCampaignDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDeleteTargetCampaign(null);
        }}
        campaignName={(deleteTargetCampaign || selectedCampaign)?.name || ""}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />
    </AgentLayout>
  );
};

export default Campaigns;
