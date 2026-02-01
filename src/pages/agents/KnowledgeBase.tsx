import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FileText, Upload, Link, Search } from "lucide-react";

const KnowledgeBase = () => {
  return (
    <AgentLayout
      title="Knowledge Base"
      description="Add documents and information for your agents to reference"
    >
      <div className="space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search knowledge base..." className="pl-10" />
        </div>

        {/* Upload Options */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group border-dashed">
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

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group border-dashed">
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

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group border-dashed">
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

        {/* Empty State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Add documents, FAQs, or website content to help your agents provide accurate responses
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Document
            </Button>
          </CardContent>
        </Card>
      </div>
    </AgentLayout>
  );
};

export default KnowledgeBase;
