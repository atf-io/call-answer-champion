import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Star } from "lucide-react";
import type { ReviewsAgentSettings } from "../AgentConfigStep";
import type { BusinessProfile } from "@/pages/Onboarding";

interface ReviewsAgentConfigProps {
  settings: ReviewsAgentSettings;
  onSettingsChange: (settings: ReviewsAgentSettings) => void;
  businessProfile: BusinessProfile;
}

const TONES = [
  { value: "professional", label: "Professional", description: "Formal and business-like" },
  { value: "friendly", label: "Friendly", description: "Warm and approachable" },
  { value: "enthusiastic", label: "Enthusiastic", description: "Excited and appreciative" },
  { value: "empathetic", label: "Empathetic", description: "Understanding and caring" },
];

const ReviewsAgentConfig = ({ settings, onSettingsChange, businessProfile }: ReviewsAgentConfigProps) => {
  const handleChange = (field: keyof ReviewsAgentSettings, value: string | number | boolean) => {
    onSettingsChange({ ...settings, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
          <Star className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Configure Google Reviews Agent</h2>
        <p className="text-muted-foreground">
          Set up automated responses to maintain your online reputation
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="agent-name">Agent Name</Label>
          <Input
            id="agent-name"
            value={settings.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Reviews Agent"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tone">Response Tone</Label>
          <Select
            value={settings.tone}
            onValueChange={(value) => handleChange("tone", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent>
              {TONES.map((tone) => (
                <SelectItem key={tone.value} value={tone.value}>
                  <div>
                    <span className="font-medium">{tone.label}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{tone.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-respond">Auto-Respond to Reviews</Label>
              <p className="text-sm text-muted-foreground">
                Automatically generate and post responses to positive reviews
              </p>
            </div>
            <Switch
              id="auto-respond"
              checked={settings.autoRespond}
              onCheckedChange={(checked) => handleChange("autoRespond", checked)}
            />
          </div>
        </div>

        {settings.autoRespond && (
          <div className="space-y-4 md:col-span-2">
            <Label>
              Auto-respond to reviews with {settings.minRatingForAuto}+ stars
            </Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[settings.minRatingForAuto]}
                onValueChange={(value) => handleChange("minRatingForAuto", value[0])}
                min={1}
                max={5}
                step={1}
                className="flex-1"
              />
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= settings.minRatingForAuto
                        ? "text-warning fill-warning"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Reviews below this rating will be flagged for manual response
            </p>
          </div>
        )}

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="signature">Response Signature</Label>
          <Input
            id="signature"
            value={settings.signatureText}
            onChange={(e) => handleChange("signatureText", e.target.value)}
            placeholder="- The Team at Your Business"
          />
          <p className="text-xs text-muted-foreground">
            This will be added at the end of each AI-generated response
          </p>
        </div>

        {/* Preview */}
        <div className="md:col-span-2 p-4 rounded-xl bg-muted/50 border border-border">
          <Label className="mb-3 block">Response Preview</Label>
          <div className="bg-background p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-semibold text-primary-foreground">
                {businessProfile.business_name?.charAt(0) || "B"}
              </div>
              <span className="font-medium text-sm">
                {businessProfile.business_name || "Your Business"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {settings.tone === "professional" && "Thank you for your review. We appreciate your business and are glad we could meet your expectations."}
              {settings.tone === "friendly" && "Thanks so much for the kind words! We loved having you and can't wait to see you again! 😊"}
              {settings.tone === "enthusiastic" && "WOW! Thank you for this amazing review! We're thrilled you had such a great experience with us!"}
              {settings.tone === "empathetic" && "We truly appreciate you taking the time to share your experience. Your feedback means the world to us."}
            </p>
            <p className="text-sm text-muted-foreground mt-2">{settings.signatureText}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewsAgentConfig;
