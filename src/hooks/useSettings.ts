import { useState, useEffect } from "react";
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
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSettings = async () => {
    if (!user) return;
    
    try {
      const [settingsRes, profileRes] = await Promise.all([
        api.get<UserSettings>("/api/settings").catch(() => null),
        api.get<UserProfile>("/api/profile").catch(() => null),
      ]);

      setSettings(settingsRes);
      setProfile(profileRes);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user) return null;

    try {
      const data = await api.patch<UserSettings>("/api/settings", updates);
      
      setSettings(data);
      toast({
        title: "Settings Updated",
        description: "Your settings have been saved.",
      });
      
      return data;
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings",
      });
      return null;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return null;

    try {
      const data = await api.patch<UserProfile>("/api/profile", updates);
      
      setProfile(data);
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved.",
      });
      
      return data;
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save profile",
      });
      return null;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);

  return {
    settings,
    profile,
    loading,
    updateSettings,
    updateProfile,
    refetch: fetchSettings,
  };
};
