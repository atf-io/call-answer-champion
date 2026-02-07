import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  businessName: string | null;
  onboardingCompleted: boolean | null;
}

function mapSettings(data: any): UserSettings | null {
  if (!data) return null;
  return {
    id: data.id,
    retellApiKeyConfigured: data.retell_api_key_configured ?? false,
    googleApiConfigured: data.google_api_configured ?? false,
    notificationEmail: data.notification_email ?? false,
    notificationSms: data.notification_sms ?? false,
    autoRespondReviews: data.auto_respond_reviews ?? false,
    reviewResponseTone: data.review_response_tone ?? 'professional',
    timezone: data.timezone ?? 'America/New_York',
  };
}

function mapProfile(data: any): UserProfile | null {
  if (!data) return null;
  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    companyName: data.company_name,
    avatarUrl: data.avatar_url,
    businessName: data.business_name,
    onboardingCompleted: data.onboarding_completed,
  };
}

export const useSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings = null, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching settings:', error);
        return null;
      }
      return mapSettings(data);
    },
    enabled: !!user,
  });

  const { data: profile = null, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return mapProfile(data);
    },
    enabled: !!user,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<UserSettings>) => {
      if (!user) throw new Error('Not authenticated');
      
      const dbUpdates: any = {};
      if (updates.retellApiKeyConfigured !== undefined) dbUpdates.retell_api_key_configured = updates.retellApiKeyConfigured;
      if (updates.googleApiConfigured !== undefined) dbUpdates.google_api_configured = updates.googleApiConfigured;
      if (updates.notificationEmail !== undefined) dbUpdates.notification_email = updates.notificationEmail;
      if (updates.notificationSms !== undefined) dbUpdates.notification_sms = updates.notificationSms;
      if (updates.autoRespondReviews !== undefined) dbUpdates.auto_respond_reviews = updates.autoRespondReviews;
      if (updates.reviewResponseTone !== undefined) dbUpdates.review_response_tone = updates.reviewResponseTone;
      if (updates.timezone !== undefined) dbUpdates.timezone = updates.timezone;
      
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, ...dbUpdates })
        .select()
        .single();
      
      if (error) throw error;
      return mapSettings(data);
    },
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
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!user) throw new Error('Not authenticated');
      
      const dbUpdates: any = {};
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
      if (updates.companyName !== undefined) dbUpdates.company_name = updates.companyName;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.businessName !== undefined) dbUpdates.business_name = updates.businessName;
      if (updates.onboardingCompleted !== undefined) dbUpdates.onboarding_completed = updates.onboardingCompleted;
      
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ user_id: user.id, ...dbUpdates })
        .select()
        .single();
      
      if (error) throw error;
      return mapProfile(data);
    },
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
