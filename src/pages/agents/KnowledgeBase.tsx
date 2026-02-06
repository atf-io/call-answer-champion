import { useState } from "react";
import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, FileText, Upload, Link, Search, Loader2, Trash2, ExternalLink, Globe, X, ChevronDown, ChevronUp, Edit, Save } from "lucide-react";
import { useKnowledgeBase, KnowledgeBaseEntry } from "@/hooks/useKnowledgeBase";
import { formatDistanceToNow } from "date-fns";

const KnowledgeBase = () => {
  const { entries, isLoading, scrapeUrl, isScraping, addText, isAddingText, deleteEntry, toggleActive, updateEntry, isUpdating } = useKnowledgeBase();
  
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  const handleAddUrl = () => {
    if (!url.trim()) return;
    scrapeUrl({ url: url.trim() }, {
      onSuccess: () => {
        setUrl("");
        setUrlDialogOpen(false);
      }
    });
  };

  const handleAddText = () => {
    if (!textTitle.trim() || !textContent.trim()) return;
    addText({ title: textTitle.trim(), content: textContent.trim() }, {
      onSuccess: () => {
        setTextTitle("");
        setTextContent("");
        setTextDialogOpen(false);
      }
    });
  };

  const filteredEntries = entries.filter(entry => 
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'url': return <Globe className="w-4 h-4" />;
      case 'file': return <Upload className="w-4 h-4" />;
      case 'text': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <AgentLayout
      title="Business Profile"
      description="Scrape your website to automatically populate your business profile for AI agents"
    >
      <div className="space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search knowledge base..." 
            className="pl-10" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Upload Options */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer group border-dashed"
            onClick={() => alert('File upload coming soon')}
          >
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Upload Files</h3>
              <p className="text-sm text-muted-foreground text-center">
                PDF, DOCX, TXT files
              </p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer group border-dashed"
            onClick={() => setUrlDialogOpen(true)}
          >
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Link className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Add Website URL</h3>
              <p className="text-sm text-muted-foreground text-center">
                Scrape content from URLs
              </p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer group border-dashed"
            onClick={() => setTextDialogOpen(true)}
          >
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Write Content</h3>
              <p className="text-sm text-muted-foreground text-center">
                Create text entries manually
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && entries.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Add documents, FAQs, or website content to help your agents provide accurate responses
              </p>
              <Button onClick={() => setUrlDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Document
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Entries List */}
        {!isLoading && filteredEntries.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{filteredEntries.length} Knowledge Base Entries</h3>
            {filteredEntries.map((entry) => (
              <KnowledgeBaseEntryCard 
                key={entry.id} 
                entry={entry}
                isExpanded={expandedEntryId === entry.id}
                onToggleExpand={() => setExpandedEntryId(expandedEntryId === entry.id ? null : entry.id)}
                onDelete={() => deleteEntry(entry.id)}
                onToggleActive={(active) => toggleActive({ entryId: entry.id, isActive: active })}
                onUpdate={(data) => updateEntry({ entryId: entry.id, data })}
                isUpdating={isUpdating}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add URL Dialog */}
      <Dialog open={urlDialogOpen} onOpenChange={setUrlDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Website URL</DialogTitle>
            <DialogDescription>
              Enter a URL to scrape and add its content to your knowledge base. The content will be available for your AI agents to reference.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="url">Website URL</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="url"
                  placeholder="https://example.com/page"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-10"
                  disabled={isScraping}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUrlDialogOpen(false)} disabled={isScraping}>
              Cancel
            </Button>
            <Button onClick={handleAddUrl} disabled={isScraping || !url.trim()}>
              {isScraping ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add URL
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Text Dialog */}
      <Dialog open={textDialogOpen} onOpenChange={setTextDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Write Content</DialogTitle>
            <DialogDescription>
              Add custom content like FAQs, policies, or product information for your agents to reference.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Pricing Information, FAQ, Return Policy"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                disabled={isAddingText}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Enter the content your agents should know about..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={10}
                disabled={isAddingText}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTextDialogOpen(false)} disabled={isAddingText}>
              Cancel
            </Button>
            <Button onClick={handleAddText} disabled={isAddingText || !textTitle.trim() || !textContent.trim()}>
              {isAddingText ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Content
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AgentLayout>
  );
};

interface KnowledgeBaseEntryCardProps {
  entry: KnowledgeBaseEntry;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  onToggleActive: (active: boolean) => void;
  onUpdate: (data: { title?: string; content?: string }) => void;
  isUpdating: boolean;
}

const KnowledgeBaseEntryCard = ({ entry, isExpanded, onToggleExpand, onDelete, onToggleActive, onUpdate, isUpdating }: KnowledgeBaseEntryCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(entry.title);
  const [editContent, setEditContent] = useState(entry.content);

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'url': return <Globe className="w-4 h-4" />;
      case 'file': return <Upload className="w-4 h-4" />;
      case 'text': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handleSave = () => {
    if (!editTitle.trim() || !editContent.trim()) return;
    onUpdate({ title: editTitle.trim(), content: editContent.trim() });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(entry.title);
    setEditContent(entry.content);
    setIsEditing(false);
  };

  const truncatedContent = entry.content.length > 200 
    ? entry.content.substring(0, 200) + '...' 
    : entry.content;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              {getSourceIcon(entry.sourceType)}
            </div>
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-base font-semibold"
                  data-testid={`input-edit-title-${entry.id}`}
                />
              ) : (
                <CardTitle className="text-base truncate">{entry.title}</CardTitle>
              )}
              <CardDescription className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="capitalize">{entry.sourceType}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}</span>
                {entry.sourceUrl && (
                  <>
                    <span>•</span>
                    <a 
                      href={entry.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View source <ExternalLink className="w-3 h-3" />
                    </a>
                  </>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel} data-testid={`button-cancel-edit-${entry.id}`}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isUpdating} data-testid={`button-save-edit-${entry.id}`}>
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} data-testid={`button-edit-${entry.id}`}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Switch 
                  checked={entry.isActive} 
                  onCheckedChange={onToggleActive}
                  aria-label="Toggle active"
                />
                <Button variant="ghost" size="icon" onClick={onDelete} data-testid={`button-delete-${entry.id}`}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {entry.summary && (
          <p className="text-sm text-muted-foreground mb-3">
            <strong>Summary:</strong> {entry.summary}
          </p>
        )}
        <div className="bg-muted/50 rounded-lg p-3">
          {isEditing ? (
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={8}
              className="text-sm"
              data-testid={`textarea-edit-content-${entry.id}`}
            />
          ) : (
            <>
              <p className="text-sm whitespace-pre-wrap">
                {isExpanded ? entry.content : truncatedContent}
              </p>
              {entry.content.length > 200 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onToggleExpand}
                  className="mt-2 h-auto p-0 text-primary"
                  data-testid={`button-toggle-expand-${entry.id}`}
                >
                  {isExpanded ? (
                    <>Show less <ChevronUp className="w-4 h-4 ml-1" /></>
                  ) : (
                    <>Show more <ChevronDown className="w-4 h-4 ml-1" /></>
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KnowledgeBase;
