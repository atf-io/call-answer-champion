import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface UserSettings {
  id: string;
  retell_api_key_configured: boolean;
  google_api_configured: boolean;
  notification_email: boolean;
  notification_sms: boolean;
  auto_respond_reviews: boolean;
  review_response_tone: string;
  timezone: string;
}

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
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
        supabase.from("user_settings").select("*").single(),
        supabase.from("profiles").select("*").single(),
      ]);

      if (settingsRes.error && settingsRes.error.code !== "PGRST116") {
        throw settingsRes.error;
      }
      if (profileRes.error && profileRes.error.code !== "PGRST116") {
        throw profileRes.error;
      }

      setSettings(settingsRes.data as UserSettings | null);
      setProfile(profileRes.data as UserProfile | null);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("user_settings")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      
      setSettings(data as UserSettings);
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
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      
      setProfile(data as UserProfile);
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
