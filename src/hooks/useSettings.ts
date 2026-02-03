import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface UserSettings {
  id: string;
  retellApiKeyConfigured: boolean;
  googleApiConfigured: boolean;
  notificationEmail: boolean;
  notificationSms: boolean;
  autoRespondReviews: boolean;
  reviewResponseTone: string;
  timezone: string;
}

export interface UserProfile {
  id: string;
  email: string | null;
  fullName: string | null;
  companyName: string | null;
  avatarUrl: string | null;
}

export const useSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings = null, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<UserSettings>("/api/settings").catch(() => null),
    enabled: !!user,
  });

  const { data: profile = null, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<UserProfile>("/api/profile").catch(() => null),
    enabled: !!user,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (updates: Partial<UserSettings>) => api.patch<UserSettings>("/api/settings", updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: "Settings Updated",
        description: "Your settings have been saved.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (updates: Partial<UserProfile>) => api.patch<UserProfile>("/api/profile", updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save profile",
      });
    },
  });

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user) return null;
    try {
      return await updateSettingsMutation.mutateAsync(updates);
    } catch {
      return null;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return null;
    try {
      return await updateProfileMutation.mutateAsync(updates);
    } catch {
      return null;
    }
  };

  return {
    settings,
    profile,
    loading: settingsLoading || profileLoading,
    updateSettings,
    updateProfile,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  };
};
