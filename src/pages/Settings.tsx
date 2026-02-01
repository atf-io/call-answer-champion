import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Key, 
  Globe,
  Save,
  Loader2,
  CheckCircle2,
  XCircle
} from "lucide-react";

const Settings = () => {
  const { settings, profile, loading, updateSettings, updateProfile } = useSettings();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    company_name: "",
    notification_email: true,
    notification_sms: false,
    auto_respond_reviews: false,
    review_response_tone: "professional",
    timezone: "America/New_York",
  });

  // Update form when data loads
  useState(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        full_name: profile.full_name || "",
        company_name: profile.company_name || "",
      }));
    }
    if (settings) {
      setFormData((prev) => ({
        ...prev,
        notification_email: settings.notification_email,
        notification_sms: settings.notification_sms,
        auto_respond_reviews: settings.auto_respond_reviews,
        review_response_tone: settings.review_response_tone,
        timezone: settings.timezone,
      }));
    }
  });

  const handleSaveProfile = async () => {
    setSaving(true);
    await updateProfile({
      full_name: formData.full_name,
      company_name: formData.company_name,
    });
    setSaving(false);
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    await updateSettings({
      notification_email: formData.notification_email,
      notification_sms: formData.notification_sms,
      auto_respond_reviews: formData.auto_respond_reviews,
      review_response_tone: formData.review_response_tone,
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
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
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
                <div className="flex items-center gap-3">
                  {settings?.retell_api_key_configured ? (
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
                    {settings?.retell_api_key_configured ? "Manage" : "Connect"}
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
                  {settings?.google_api_configured ? (
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
                    {settings?.google_api_configured ? "Manage" : "Connect"}
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
                  checked={formData.notification_email}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, notification_email: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">SMS Notifications</h3>
                  <p className="text-sm text-muted-foreground">Receive alerts via text message</p>
                </div>
                <Switch
                  checked={formData.notification_sms}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, notification_sms: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Auto-Respond to Reviews</h3>
                  <p className="text-sm text-muted-foreground">Let AI automatically respond to new reviews</p>
                </div>
                <Switch
                  checked={formData.auto_respond_reviews}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, auto_respond_reviews: checked })
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
