import { useState, useEffect } from "react";
import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  MessageSquare,
  Plus,
  Trash2,
  Send,
  Loader2,
  Search,
  Settings as SettingsIcon,
  FileText,
  Megaphone,
  TestTube,
} from "lucide-react";
import { useSmsAgents, SmsAgent, CreateSmsAgentData } from "@/hooks/useSmsAgents";
import SmsCampaigns from "@/components/agents/SmsCampaigns";
import { useParams, useNavigate } from "react-router-dom";

const SMS = () => {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const {
    agents,
    isLoading,
    createSmsAgent,
    updateSmsAgent,
    deleteSmsAgent,
    isCreating,
    isUpdating,
    isDeleting,
  } = useSmsAgents();

  const [selectedAgent, setSelectedAgent] = useState<SmsAgent | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [editName, setEditName] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [editGreeting, setEditGreeting] = useState("");
  const [editModel, setEditModel] = useState("gpt-4o-mini");
  const [editTemperature, setEditTemperature] = useState(0.7);
  const [editMaxTokens, setEditMaxTokens] = useState(500);
  const [editIsActive, setEditIsActive] = useState(true);

  useEffect(() => {
    if (agentId && agents.length > 0) {
      const agent = agents.find((a) => a.id === agentId);
      if (agent) {
        selectAgent(agent);
      }
    } else if (!agentId && agents.length > 0 && !selectedAgent) {
      selectAgent(agents[0]);
    }
  }, [agentId, agents]);

  const selectAgent = (agent: SmsAgent) => {
    setSelectedAgent(agent);
    setEditName(agent.name);
    setEditPrompt(agent.prompt || "");
    setEditGreeting(agent.greeting_message || "");
    setEditModel("gpt-4o-mini");
    setEditTemperature(0.7);
    setEditMaxTokens(500);
    setEditIsActive(agent.is_active ?? true);
  };

  const handleCreate = async () => {
    if (!newAgentName.trim()) return;
    const data: CreateSmsAgentData = { name: newAgentName.trim() };
    const newAgent = await createSmsAgent(data);
    setNewAgentName("");
    setCreateDialogOpen(false);
    if (newAgent) {
      selectAgent(newAgent);
    }
  };

  const handleSave = async () => {
    if (!selectedAgent) return;
    await updateSmsAgent(selectedAgent.id, {
      name: editName,
      prompt: editPrompt,
      greeting_message: editGreeting,
      is_active: editIsActive,
    });
  };

  const handleDelete = async () => {
    if (!selectedAgent) return;
    await deleteSmsAgent(selectedAgent.id);
    setSelectedAgent(null);
    setDeleteDialogOpen(false);
  };

  const filteredAgents = agents.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AgentLayout
      title="SMS / Text"
      description="Create and manage SMS agents for text conversations"
    >
      <div className="flex gap-6 h-[calc(100vh-12rem)]">
        <div className="w-72 shrink-0 flex flex-col border rounded-lg">
          <div className="p-3 border-b space-y-2">
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="w-full"
              data-testid="button-create-sms-agent"
            >
              <Plus className="w-4 h-4 mr-2" />
              New SMS Agent
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search agents..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-sms-agents"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <MessageSquare className="w-10 h-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "No agents match your search" : "No SMS agents yet"}
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredAgents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      selectAgent(agent);
                      navigate(`/dashboard/agents/sms/${agent.id}`);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      selectedAgent?.id === agent.id
                        ? "bg-primary text-primary-foreground"
                        : "hover-elevate"
                    }`}
                    data-testid={`button-agent-${agent.id}`}
                  >
                    <div className="font-medium truncate">{agent.name}</div>
                    <div className={`text-xs mt-0.5 ${
                      selectedAgent?.id === agent.id
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}>
                      {agent.is_active ? "Active" : "Inactive"}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {!selectedAgent ? (
            <Card className="h-full">
              <CardContent className="flex flex-col items-center justify-center h-full">
                <MessageSquare className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2" data-testid="text-no-agent-selected">Select or create an SMS agent</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  Choose an agent from the sidebar or create a new one to get started.
                </p>
                <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-agent-empty">
                  <Plus className="w-4 h-4 mr-2" />
                  Create SMS Agent
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4 h-full overflow-y-auto">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-lg font-semibold max-w-xs"
                    data-testid="input-agent-name"
                  />
                  <Switch
                    checked={editIsActive}
                    onCheckedChange={setEditIsActive}
                    data-testid="switch-agent-active"
                  />
                  <span className="text-sm text-muted-foreground">
                    {editIsActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(true)}
                    data-testid="button-delete-agent"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isUpdating}
                    data-testid="button-save-agent"
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="prompt" className="w-full">
                <TabsList data-testid="tabs-agent-edit">
                  <TabsTrigger value="prompt" data-testid="tab-prompt">
                    <FileText className="w-4 h-4 mr-2" />
                    Prompt
                  </TabsTrigger>
                  <TabsTrigger value="settings" data-testid="tab-settings">
                    <SettingsIcon className="w-4 h-4 mr-2" />
                    Settings
                  </TabsTrigger>
                  <TabsTrigger value="campaigns" data-testid="tab-campaigns">
                    <Megaphone className="w-4 h-4 mr-2" />
                    Campaigns
                  </TabsTrigger>
                  <TabsTrigger value="test" data-testid="tab-test">
                    <TestTube className="w-4 h-4 mr-2" />
                    Test
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="prompt" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>System Prompt</CardTitle>
                      <CardDescription>
                        Define how your SMS agent should behave and respond to messages.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        placeholder="You are a helpful SMS assistant for our business. Respond to customer inquiries professionally and concisely..."
                        rows={10}
                        data-testid="textarea-system-prompt"
                      />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Greeting Message</CardTitle>
                      <CardDescription>
                        The first message sent when a new conversation starts.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={editGreeting}
                        onChange={(e) => setEditGreeting(e.target.value)}
                        placeholder="Hi! Thanks for reaching out. How can I help you today?"
                        rows={3}
                        data-testid="textarea-greeting-message"
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Model Settings</CardTitle>
                      <CardDescription>
                        Configure the AI model parameters for this agent.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label>Model</Label>
                        <Select value={editModel} onValueChange={setEditModel}>
                          <SelectTrigger data-testid="select-model">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                            <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Temperature: {editTemperature}</Label>
                        <Slider
                          value={[editTemperature]}
                          onValueChange={([v]) => setEditTemperature(v)}
                          min={0}
                          max={2}
                          step={0.1}
                          data-testid="slider-temperature"
                        />
                        <p className="text-xs text-muted-foreground">
                          Lower values make output more focused and deterministic.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Max Tokens: {editMaxTokens}</Label>
                        <Slider
                          value={[editMaxTokens]}
                          onValueChange={([v]) => setEditMaxTokens(v)}
                          min={50}
                          max={2000}
                          step={50}
                          data-testid="slider-max-tokens"
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum number of tokens in the response.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="campaigns" className="mt-4">
                  <SmsCampaigns agentId={selectedAgent.id} />
                </TabsContent>

                <TabsContent value="test" className="mt-4">
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <TestTube className="w-16 h-16 text-muted-foreground/30 mb-4" />
                      <h3 className="text-lg font-semibold mb-2" data-testid="text-test-placeholder">Test conversation coming soon</h3>
                      <p className="text-muted-foreground text-center max-w-md">
                        You'll be able to test your SMS agent in a simulated conversation here.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create SMS Agent</DialogTitle>
            <DialogDescription>
              Give your new SMS agent a name to get started.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="agent-name">Agent Name</Label>
            <Input
              id="agent-name"
              value={newAgentName}
              onChange={(e) => setNewAgentName(e.target.value)}
              placeholder="e.g., Customer Support Bot"
              data-testid="input-new-agent-name"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating || !newAgentName.trim()}
              data-testid="button-confirm-create"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete SMS Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedAgent?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              data-testid="button-confirm-delete"
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

export default SMS;
