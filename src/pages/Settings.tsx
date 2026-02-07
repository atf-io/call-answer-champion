import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Key, 
  Globe,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  RefreshCw,
  Webhook
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const { settings, profile, loading, updateSettings, updateProfile, refetch } = useSettings();
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [generatingSecret, setGeneratingSecret] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
    notificationEmail: true,
    notificationSms: false,
    autoRespondReviews: false,
    reviewResponseTone: "professional",
    timezone: "America/New_York",
  });

  // Update form when data loads
  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        fullName: profile.fullName || "",
        companyName: profile.companyName || "",
      }));
    }
    if (settings) {
      setFormData((prev) => ({
        ...prev,
        notificationEmail: settings.notificationEmail,
        notificationSms: settings.notificationSms,
        autoRespondReviews: settings.autoRespondReviews,
        reviewResponseTone: settings.reviewResponseTone,
        timezone: settings.timezone,
      }));
    }
  }, [profile, settings]);

  const generateWebhookSecret = async () => {
    if (!user) return;
    setGeneratingSecret(true);
    try {
      // Generate a secure random secret
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      const newSecret = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, lead_webhook_secret: newSecret });
      
      if (error) throw error;
      
      refetch();
      toast({
        title: "Webhook Secret Generated",
        description: "Your new webhook secret has been created.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate webhook secret",
      });
    } finally {
      setGeneratingSecret(false);
    }
  };

  const copyWebhookSecret = () => {
    if (settings?.leadWebhookSecret) {
      navigator.clipboard.writeText(settings.leadWebhookSecret);
      toast({
        title: "Copied",
        description: "Webhook secret copied to clipboard",
      });
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    await updateProfile({
      fullName: formData.fullName,
      companyName: formData.companyName,
    });
    setSaving(false);
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    await updateSettings({
      notificationEmail: formData.notificationEmail,
      notificationSms: formData.notificationSms,
      autoRespondReviews: formData.autoRespondReviews,
      reviewResponseTone: formData.reviewResponseTone,
      timezone: formData.timezone,
    });
    setSaving(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and integrations</p>
        </div>

        <div className="space-y-8">
          {/* Profile Section */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Profile</h2>
                <p className="text-sm text-muted-foreground">Your account information</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Acme Inc."
                />
              </div>
            </div>

            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </Button>
          </div>

          {/* API Integrations Section */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">API Integrations</h2>
                <p className="text-sm text-muted-foreground">Connect your external services</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Retell.ai Integration */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <span className="text-lg font-bold">R</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Retell.ai</h3>
                    <p className="text-sm text-muted-foreground">AI voice agents for calls</p>
                  </div>
            </div>
          </div>

          {/* Lead Webhook Section */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Webhook className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Lead Webhook</h2>
                <p className="text-sm text-muted-foreground">Configure external lead integrations (Angi, Thumbtack, etc.)</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lead-webhook`}
                    readOnly
                    className="bg-muted/50 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lead-webhook`);
                      toast({ title: "Copied", description: "Webhook URL copied to clipboard" });
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use this URL in your lead aggregator settings to send leads to your account.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Webhook Secret</Label>
                {settings?.leadWebhookSecret ? (
                  <div className="flex gap-2">
                    <Input
                      value={settings.leadWebhookSecret}
                      readOnly
                      className="bg-muted/50 font-mono text-sm"
                    />
                    <Button variant="outline" size="icon" onClick={copyWebhookSecret}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={generateWebhookSecret}
                      disabled={generatingSecret}
                    >
                      {generatingSecret ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value="No secret generated"
                      readOnly
                      disabled
                      className="bg-muted/50"
                    />
                    <Button onClick={generateWebhookSecret} disabled={generatingSecret}>
                      {generatingSecret ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Key className="w-4 h-4 mr-2" />
                      )}
                      Generate Secret
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Include this secret in the <code className="bg-muted px-1 rounded">x-webhook-secret</code> header when calling the webhook.
                </p>
              </div>
            </div>
                <div className="flex items-center gap-3">
                  {settings?.retellApiKeyConfigured ? (
                    <span className="flex items-center gap-2 text-sm text-success">
                      <CheckCircle2 className="w-4 h-4" />
                      Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <XCircle className="w-4 h-4" />
                      Not connected
                    </span>
                  )}
                  <Button variant="outline" size="sm">
                    {settings?.retellApiKeyConfigured ? "Manage" : "Connect"}
                  </Button>
                </div>
              </div>

              {/* Google Integration */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-medium">Google Business Profile</h3>
                    <p className="text-sm text-muted-foreground">Review management</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {settings?.googleApiConfigured ? (
                    <span className="flex items-center gap-2 text-sm text-success">
                      <CheckCircle2 className="w-4 h-4" />
                      Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <XCircle className="w-4 h-4" />
                      Not connected
                    </span>
                  )}
                  <Button variant="outline" size="sm">
                    {settings?.googleApiConfigured ? "Manage" : "Connect"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Notifications</h2>
                <p className="text-sm text-muted-foreground">How you receive updates</p>
              </div>
            </div>

            <div className="space-y-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email Notifications</h3>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch
                  checked={formData.notificationEmail}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, notificationEmail: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">SMS Notifications</h3>
                  <p className="text-sm text-muted-foreground">Receive alerts via text message</p>
                </div>
                <Switch
                  checked={formData.notificationSms}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, notificationSms: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Auto-Respond to Reviews</h3>
                  <p className="text-sm text-muted-foreground">Let AI automatically respond to new reviews</p>
                </div>
                <Switch
                  checked={formData.autoRespondReviews}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, autoRespondReviews: checked })
                  }
                />
              </div>
            </div>

            <Button onClick={handleSaveNotifications} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Preferences
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
