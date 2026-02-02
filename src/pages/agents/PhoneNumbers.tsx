import { useState } from "react";
import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Phone, Search, ExternalLink, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePhoneNumbers } from "@/hooks/usePhoneNumbers";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const PhoneNumbers = () => {
  const { phoneNumbers, loading, syncing, syncPhoneNumbers } = usePhoneNumbers();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNumbers = phoneNumbers.filter(phone => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      phone.phone_number?.toLowerCase().includes(query) ||
      phone.nickname?.toLowerCase().includes(query) ||
      phone.area_code?.toLowerCase().includes(query)
    );
  });

  const formatPhoneNumber = (phone: string) => {
    // Format as (XXX) XXX-XXXX if 10 digits
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  return (
    <AgentLayout
      title="Phone Numbers"
      description="Manage phone numbers for your AI agents"
    >
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search phone numbers..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 ml-4">
            <Button variant="outline" onClick={syncPhoneNumbers} disabled={syncing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync from Retell"}
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Phone Number
            </Button>
          </div>
        </div>

        {/* Phone Number Options */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <Badge variant="secondary">Recommended</Badge>
              </div>
              <CardTitle className="text-lg">Purchase New Number</CardTitle>
              <CardDescription>
                Get a dedicated phone number for your AI agent with instant setup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Browse Available Numbers
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <ExternalLink className="w-6 h-6 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg">Import Existing Number</CardTitle>
              <CardDescription>
                Connect an existing phone number from Twilio or other providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Connect Number
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Phone Numbers List */}
        {loading ? (
          <Card>
            <CardContent className="py-8">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : filteredNumbers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Phone className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No phone numbers yet</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Add a phone number or sync from Retell to start receiving calls through your AI agents
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={syncPhoneNumbers} disabled={syncing}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                  Sync from Retell
                </Button>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Number
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNumbers.map((phone) => (
              <Card key={phone.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium font-mono">
                            {formatPhoneNumber(phone.phone_number)}
                          </span>
                          {phone.is_active ? (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          {phone.nickname && (
                            <span className="font-medium">{phone.nickname}</span>
                          )}
                          {phone.area_code && (
                            <span>• Area code: {phone.area_code}</span>
                          )}
                          {phone.inbound_agent && (
                            <span>• Inbound: {phone.inbound_agent.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {phone.last_synced_at && (
                        <p>Synced: {format(new Date(phone.last_synced_at), "MMM d, h:mm a")}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AgentLayout>
  );
};

export default PhoneNumbers;
