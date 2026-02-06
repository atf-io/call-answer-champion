import { useState } from "react";
import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, FileText, Upload, Link, Search, Loader2, Trash2, ExternalLink, Globe, X, ChevronDown, ChevronUp, Edit, Save, Sparkles, Building2, Phone, Mail, MapPin, Clock, Wrench, CheckCircle } from "lucide-react";
import { useKnowledgeBase, KnowledgeBaseEntry } from "@/hooks/useKnowledgeBase";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

interface ScrapedBusinessData {
  business_name: string;
  tagline: string;
  business_description: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  services: string[];
  specialties: string[];
  equipment_brands: string[];
  certifications: string[];
  guarantees: string[];
  payment_methods: string[];
  team_info: string;
  years_in_business: string;
  pricing_info: string;
  business_hours: Record<string, string>;
  emergency_service: boolean;
  service_area: { cities?: string[]; radius?: string };
  locations: string[];
  faqs: { question: string; answer: string }[];
  logo_url: string;
  colors: Record<string, unknown>;
  social_links: Record<string, string>;
  raw_markdown: string;
}

const KnowledgeBase = () => {
  const { entries, isLoading, scrapeUrl, isScraping, addText, isAddingText, deleteEntry, toggleActive, updateEntry, isUpdating } = useKnowledgeBase();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  const [businessUrl, setBusinessUrl] = useState("");
  const [isScrapingBusiness, setIsScrapingBusiness] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedBusinessData | null>(null);
  const [isSavingEntries, setIsSavingEntries] = useState(false);

  const handleScrapeBusinessWebsite = async () => {
    if (!businessUrl.trim()) return;
    setIsScrapingBusiness(true);
    setScrapedData(null);
    try {
      const result = await api.post<{ success: boolean; data: ScrapedBusinessData; error?: string }>('/api/scrape-business', { url: businessUrl.trim() });
      if (result.success && result.data) {
        setScrapedData(result.data);
        toast.success('Business information extracted successfully!');
      } else {
        toast.error(result.error || 'Failed to extract business information');
      }
    } catch (error) {
      console.error('Error scraping business:', error);
      toast.error('Failed to scrape website. Please check the URL and try again.');
    } finally {
      setIsScrapingBusiness(false);
    }
  };

  const handleSaveToKnowledgeBase = async () => {
    if (!scrapedData || !user) return;
    setIsSavingEntries(true);
    try {
      const entriesToCreate: { title: string; content: string }[] = [];

      if (scrapedData.business_name || scrapedData.business_description) {
        const parts = [];
        if (scrapedData.business_name) parts.push(`Business Name: ${scrapedData.business_name}`);
        if (scrapedData.tagline) parts.push(`Tagline: ${scrapedData.tagline}`);
        if (scrapedData.business_description) parts.push(`\nDescription:\n${scrapedData.business_description}`);
        if (scrapedData.years_in_business) parts.push(`\nYears in Business: ${scrapedData.years_in_business}`);
        if (scrapedData.team_info) parts.push(`\nTeam: ${scrapedData.team_info}`);
        entriesToCreate.push({ title: `${scrapedData.business_name || 'Business'} - Overview`, content: parts.join('\n') });
      }

      if (scrapedData.phone || scrapedData.email || scrapedData.address) {
        const parts = [];
        if (scrapedData.phone) parts.push(`Phone: ${scrapedData.phone}`);
        if (scrapedData.email) parts.push(`Email: ${scrapedData.email}`);
        if (scrapedData.address) parts.push(`Address: ${scrapedData.address}`);
        if (scrapedData.website) parts.push(`Website: ${scrapedData.website}`);
        if (scrapedData.locations?.length) parts.push(`\nLocations:\n${scrapedData.locations.map(l => `- ${l}`).join('\n')}`);
        entriesToCreate.push({ title: 'Contact Information', content: parts.join('\n') });
      }

      if (scrapedData.services?.length) {
        let content = scrapedData.services.map(s => `- ${s}`).join('\n');
        if (scrapedData.specialties?.length) content += `\n\nSpecialties:\n${scrapedData.specialties.map(s => `- ${s}`).join('\n')}`;
        entriesToCreate.push({ title: 'Services Offered', content });
      }

      if (scrapedData.certifications?.length || scrapedData.equipment_brands?.length) {
        const parts = [];
        if (scrapedData.certifications.length) parts.push(`Certifications & Licenses:\n${scrapedData.certifications.map(c => `- ${c}`).join('\n')}`);
        if (scrapedData.equipment_brands.length) parts.push(`Equipment & Brands:\n${scrapedData.equipment_brands.map(b => `- ${b}`).join('\n')}`);
        entriesToCreate.push({ title: 'Certifications & Equipment', content: parts.join('\n\n') });
      }

      if (Object.keys(scrapedData.business_hours || {}).length || scrapedData.emergency_service) {
        const parts = [];
        const hours = scrapedData.business_hours;
        if (Object.keys(hours).length) {
          parts.push('Business Hours:');
          Object.entries(hours).forEach(([day, time]) => {
            parts.push(`  ${day.charAt(0).toUpperCase() + day.slice(1)}: ${time}`);
          });
        }
        if (scrapedData.emergency_service) parts.push('\n24/7 Emergency Service Available');
        if (scrapedData.service_area?.cities?.length) {
          parts.push(`\nService Area: ${scrapedData.service_area.cities.join(', ')}`);
          if (scrapedData.service_area.radius) parts.push(`Service Radius: ${scrapedData.service_area.radius}`);
        }
        entriesToCreate.push({ title: 'Hours & Service Area', content: parts.join('\n') });
      }

      if (scrapedData.pricing_info || scrapedData.payment_methods?.length || scrapedData.guarantees?.length) {
        const parts = [];
        if (scrapedData.pricing_info) parts.push(`Pricing: ${scrapedData.pricing_info}`);
        if (scrapedData.payment_methods?.length) parts.push(`\nPayment Methods:\n${scrapedData.payment_methods.map(p => `- ${p}`).join('\n')}`);
        if (scrapedData.guarantees?.length) parts.push(`\nGuarantees & Warranties:\n${scrapedData.guarantees.map(g => `- ${g}`).join('\n')}`);
        entriesToCreate.push({ title: 'Pricing & Payment', content: parts.join('\n') });
      }

      if (scrapedData.faqs?.length) {
        const content = scrapedData.faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
        entriesToCreate.push({ title: 'Frequently Asked Questions', content });
      }

      if (Object.keys(scrapedData.social_links || {}).length) {
        const content = Object.entries(scrapedData.social_links)
          .filter(([, v]) => v)
          .map(([k, v]) => `${k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${v}`)
          .join('\n');
        if (content) entriesToCreate.push({ title: 'Social Media & Review Profiles', content });
      }

      if (scrapedData.raw_markdown) {
        entriesToCreate.push({ title: `${scrapedData.business_name || 'Website'} - Full Content`, content: scrapedData.raw_markdown });
      }

      for (const entry of entriesToCreate) {
        await api.post('/api/knowledge-base', {
          title: entry.title,
          sourceType: 'url',
          sourceUrl: scrapedData.website || businessUrl,
          content: entry.content,
          summary: null,
          metadata: { scraped_from: scrapedData.website, auto_generated: true },
        });
      }

      toast.success(`${entriesToCreate.length} entries added to your business profile!`);
      setScrapedData(null);
      setBusinessUrl("");
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
    } catch (error) {
      console.error('Error saving entries:', error);
      toast.error('Failed to save some entries. Please try again.');
    } finally {
      setIsSavingEntries(false);
    }
  };

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

  const hasData = (val: unknown) => {
    if (!val) return false;
    if (typeof val === 'string') return val.trim().length > 0;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'object') return Object.keys(val as object).length > 0;
    return Boolean(val);
  };

  return (
    <AgentLayout
      title="Business Profile"
      description="Scrape your website to automatically populate your business profile for AI agents"
    >
      <div className="space-y-6">
        {/* Smart Website Scanner */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Scan Your Business Website</CardTitle>
                <CardDescription>
                  Enter your website URL and we'll automatically extract your business details, services, hours, FAQs, and more
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="https://yourbusiness.com"
                  value={businessUrl}
                  onChange={(e) => setBusinessUrl(e.target.value)}
                  className="pl-10"
                  disabled={isScrapingBusiness}
                  data-testid="input-business-url"
                />
              </div>
              <Button 
                onClick={handleScrapeBusinessWebsite} 
                disabled={isScrapingBusiness || !businessUrl.trim()}
                data-testid="button-scan-website"
              >
                {isScrapingBusiness ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Scan Website
                  </>
                )}
              </Button>
            </div>

            {/* Scraped Results Preview */}
            {scrapedData && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-base">Extracted Business Information</h4>
                  <Button 
                    onClick={handleSaveToKnowledgeBase} 
                    disabled={isSavingEntries}
                    data-testid="button-save-to-profile"
                  >
                    {isSavingEntries ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save All to Profile
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {hasData(scrapedData.business_name) && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5" />
                        Business Name
                      </div>
                      <p className="font-medium" data-testid="text-scraped-business-name">{scrapedData.business_name}</p>
                      {scrapedData.tagline && <p className="text-sm text-muted-foreground">{scrapedData.tagline}</p>}
                    </div>
                  )}
                  {hasData(scrapedData.phone) && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        Phone
                      </div>
                      <p className="font-medium" data-testid="text-scraped-phone">{scrapedData.phone}</p>
                    </div>
                  )}
                  {hasData(scrapedData.email) && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" />
                        Email
                      </div>
                      <p className="font-medium" data-testid="text-scraped-email">{scrapedData.email}</p>
                    </div>
                  )}
                  {hasData(scrapedData.address) && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        Address
                      </div>
                      <p className="font-medium" data-testid="text-scraped-address">{scrapedData.address}</p>
                    </div>
                  )}
                </div>

                {hasData(scrapedData.business_description) && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm">{scrapedData.business_description}</p>
                  </div>
                )}

                {hasData(scrapedData.services) && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Wrench className="w-3.5 h-3.5" />
                      Services ({scrapedData.services.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {scrapedData.services.map((s, i) => (
                        <Badge key={i} variant="secondary">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {hasData(scrapedData.certifications) && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Certifications ({scrapedData.certifications.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {scrapedData.certifications.map((c, i) => (
                        <Badge key={i} variant="outline">{c}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {hasData(scrapedData.business_hours) && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      Business Hours
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-sm">
                      {Object.entries(scrapedData.business_hours).map(([day, time]) => (
                        <div key={day} className="flex justify-between gap-2">
                          <span className="capitalize text-muted-foreground">{day}:</span>
                          <span>{time}</span>
                        </div>
                      ))}
                    </div>
                    {scrapedData.emergency_service && (
                      <Badge variant="default" className="mt-1">24/7 Emergency Service</Badge>
                    )}
                  </div>
                )}

                {hasData(scrapedData.faqs) && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">FAQs ({scrapedData.faqs.length} found)</p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Click "Save All to Profile" to create organized knowledge base entries from this data. You can edit them afterward.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search knowledge base..." 
            className="pl-10" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-knowledge-base"
          />
        </div>

        {/* Additional Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card 
            className="hover-elevate cursor-pointer group border-dashed"
            onClick={() => setUrlDialogOpen(true)}
          >
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Link className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Add Individual URL</h3>
                <p className="text-xs text-muted-foreground">Scrape a specific page</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover-elevate cursor-pointer group border-dashed"
            onClick={() => setTextDialogOpen(true)}
          >
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Write Content</h3>
                <p className="text-xs text-muted-foreground">Create text entries manually</p>
              </div>
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
