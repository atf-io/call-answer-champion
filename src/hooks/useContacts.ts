import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface Contact {
  id: string;
  userId: number;
  name: string;
  phone: string | null;
  email: string | null;
  source: string;
  status: string;
  tags: string[] | null;
  notes: string | null;
  lastContactedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactData {
  name: string;
  phone?: string;
  email?: string;
  source?: string;
  status?: string;
  tags?: string[];
  notes?: string;
}

export function useContacts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: contacts = [],
    isLoading,
    error,
  } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
    queryFn: () => api.get<Contact[]>("/api/contacts"),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateContactData) =>
      api.post<Contact>("/api/contacts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Contact created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create contact", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateContactData> }) =>
      api.patch<Contact>("/api/contacts/" + id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Contact updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update contact", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete("/api/contacts/" + id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Contact deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete contact", description: error.message, variant: "destructive" });
    },
  });

  return {
    contacts,
    isLoading,
    error,
    createContact: createMutation.mutateAsync,
    updateContact: (id: string, data: Partial<CreateContactData>) =>
      updateMutation.mutateAsync({ id, data }),
    deleteContact: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
