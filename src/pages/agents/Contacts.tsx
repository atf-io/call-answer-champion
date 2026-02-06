import { useState, useMemo } from "react";
import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Users,
  UserCheck,
  CalendarDays,
  TrendingUp,
  Search,
  Plus,
  Loader2,
  Trash2,
  Pencil,
  Phone,
  Mail,
} from "lucide-react";
import { useContacts, Contact, CreateContactData } from "@/hooks/useContacts";
import { formatDistanceToNow } from "date-fns";

const STATUS_OPTIONS = ["New", "Contacted", "Qualified", "Converted"] as const;
const SOURCE_OPTIONS = ["Manual", "Voice AI", "SMS", "Web Form", "Import"] as const;

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status.toLowerCase()) {
    case "converted":
      return "default";
    case "qualified":
      return "secondary";
    case "contacted":
      return "outline";
    default:
      return "secondary";
  }
}

const Contacts = () => {
  const {
    contacts,
    isLoading,
    createContact,
    updateContact,
    deleteContact,
    isCreating,
    isUpdating,
    isDeleting,
  } = useContacts();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newSource, setNewSource] = useState("Manual");
  const [newStatus, setNewStatus] = useState("New");

  const [editNotes, setEditNotes] = useState("");

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const matchesSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || c.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesSource =
        sourceFilter === "all" || c.source.toLowerCase() === sourceFilter.toLowerCase();
      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [contacts, searchQuery, statusFilter, sourceFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
      total: contacts.length,
      active: contacts.filter(
        (c) => c.status.toLowerCase() !== "converted"
      ).length,
      thisWeek: contacts.filter(
        (c) => new Date(c.createdAt) >= weekAgo
      ).length,
      converted: contacts.filter(
        (c) => c.status.toLowerCase() === "converted"
      ).length,
    };
  }, [contacts]);

  const statCards = [
    { label: "Total Contacts", value: stats.total, icon: Users },
    { label: "Active", value: stats.active, icon: UserCheck },
    { label: "This Week", value: stats.thisWeek, icon: CalendarDays },
    { label: "Converted", value: stats.converted, icon: TrendingUp },
  ];

  const handleCreateContact = async () => {
    if (!newName.trim()) return;
    const data: CreateContactData = {
      name: newName.trim(),
      phone: newPhone.trim() || undefined,
      email: newEmail.trim() || undefined,
      source: newSource,
      status: newStatus,
    };
    await createContact(data);
    setNewName("");
    setNewPhone("");
    setNewEmail("");
    setNewSource("Manual");
    setNewStatus("New");
    setCreateDialogOpen(false);
  };

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setEditNotes(contact.notes || "");
    setIsEditing(false);
    setSheetOpen(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedContact) return;
    await updateContact(selectedContact.id, { notes: editNotes });
    setSelectedContact({ ...selectedContact, notes: editNotes });
    setIsEditing(false);
  };

  const handleDeleteContact = async () => {
    if (!selectedContact) return;
    await deleteContact(selectedContact.id);
    setDeleteDialogOpen(false);
    setSheetOpen(false);
    setSelectedContact(null);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return "Unknown";
    }
  };

  return (
    <AgentLayout title="Contacts">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p
                    className="text-2xl font-bold"
                    data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-contacts"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s.toLowerCase()}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[160px]" data-testid="select-source-filter">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {SOURCE_OPTIONS.map((s) => (
                <SelectItem key={s} value={s.toLowerCase()}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            data-testid="button-add-contact"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p
                  className="text-muted-foreground"
                  data-testid="text-contacts-empty"
                >
                  {contacts.length === 0
                    ? "No contacts yet. Add your first contact to get started."
                    : "No contacts match your filters."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Contact</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow
                      key={contact.id}
                      className="cursor-pointer hover-elevate"
                      onClick={() => handleSelectContact(contact)}
                      data-testid={`row-contact-${contact.id}`}
                    >
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell>{contact.phone || "—"}</TableCell>
                      <TableCell>{contact.email || "—"}</TableCell>
                      <TableCell>{contact.source}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(contact.status)}>
                          {contact.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(contact.lastContactedAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectContact(contact);
                          }}
                          data-testid={`button-view-contact-${contact.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {selectedContact && (
            <>
              <SheetHeader>
                <SheetTitle data-testid="text-contact-name">
                  {selectedContact.name}
                </SheetTitle>
                <SheetDescription>Contact details</SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                <div className="space-y-3">
                  {selectedContact.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span data-testid="text-contact-email">
                        {selectedContact.email}
                      </span>
                    </div>
                  )}
                  {selectedContact.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span data-testid="text-contact-phone">
                        {selectedContact.phone}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={getStatusVariant(selectedContact.status)}>
                    {selectedContact.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Last contacted {formatDate(selectedContact.lastContactedAt)}
                  </span>
                </div>

                {selectedContact.tags && selectedContact.tags.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedContact.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">Notes</p>
                    {!isEditing && (
                      <Button
                       
                        variant="ghost"
                        onClick={() => setIsEditing(true)}
                        data-testid="button-edit-notes"
                      >
                        <Pencil className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        rows={4}
                        data-testid="textarea-contact-notes"
                      />
                      <div className="flex gap-2">
                        <Button
                         
                          onClick={handleSaveNotes}
                          disabled={isUpdating}
                          data-testid="button-save-notes"
                        >
                          {isUpdating && (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          )}
                          Save
                        </Button>
                        <Button
                         
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setEditNotes(selectedContact.notes || "");
                          }}
                          data-testid="button-cancel-notes"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p
                      className="text-sm text-muted-foreground"
                      data-testid="text-contact-notes"
                    >
                      {selectedContact.notes || "No notes yet."}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setIsEditing(true);
                    }}
                    data-testid="button-edit-contact"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setDeleteDialogOpen(true)}
                    data-testid="button-delete-contact"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
            <DialogDescription>
              Create a new contact in your system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Name *</Label>
              <Input
                id="contact-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="John Doe"
                data-testid="input-new-contact-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone</Label>
              <Input
                id="contact-phone"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                data-testid="input-new-contact-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="john@example.com"
                data-testid="input-new-contact-email"
              />
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={newSource} onValueChange={setNewSource}>
                <SelectTrigger data-testid="select-new-contact-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger data-testid="select-new-contact-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              data-testid="button-cancel-create"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateContact}
              disabled={isCreating || !newName.trim()}
              data-testid="button-confirm-create"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedContact?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteContact}
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

export default Contacts;
