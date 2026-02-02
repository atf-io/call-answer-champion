import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phone, Loader2 } from "lucide-react";
import { useAgents } from "@/hooks/useAgents";

interface PurchasePhoneNumberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchase: (data: {
    area_code?: string;
    nickname?: string;
    inbound_agent_id?: string;
    outbound_agent_id?: string;
  }) => Promise<void>;
  isPurchasing: boolean;
}

// Common US area codes for quick selection
const POPULAR_AREA_CODES = [
  { code: "212", city: "New York, NY" },
  { code: "213", city: "Los Angeles, CA" },
  { code: "312", city: "Chicago, IL" },
  { code: "415", city: "San Francisco, CA" },
  { code: "305", city: "Miami, FL" },
  { code: "404", city: "Atlanta, GA" },
  { code: "214", city: "Dallas, TX" },
  { code: "713", city: "Houston, TX" },
  { code: "206", city: "Seattle, WA" },
  { code: "602", city: "Phoenix, AZ" },
  { code: "303", city: "Denver, CO" },
  { code: "617", city: "Boston, MA" },
];

export const PurchasePhoneNumberDialog = ({
  open,
  onOpenChange,
  onPurchase,
  isPurchasing,
}: PurchasePhoneNumberDialogProps) => {
  const { agents } = useAgents();
  const [areaCode, setAreaCode] = useState("");
  const [customAreaCode, setCustomAreaCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [inboundAgentId, setInboundAgentId] = useState<string>("");
  const [outboundAgentId, setOutboundAgentId] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalAreaCode = areaCode === "custom" ? customAreaCode : areaCode;
    
    await onPurchase({
      area_code: finalAreaCode || undefined,
      nickname: nickname || undefined,
      inbound_agent_id: inboundAgentId || undefined,
      outbound_agent_id: outboundAgentId || undefined,
    });

    // Reset form on success
    setAreaCode("");
    setCustomAreaCode("");
    setNickname("");
    setInboundAgentId("");
    setOutboundAgentId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Purchase Phone Number
          </DialogTitle>
          <DialogDescription>
            Get a new phone number from Retell. Numbers are billed monthly through your Retell account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="area-code">Area Code (Optional)</Label>
            <Select value={areaCode} onValueChange={setAreaCode}>
              <SelectTrigger>
                <SelectValue placeholder="Any area code" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any area code</SelectItem>
                {POPULAR_AREA_CODES.map((ac) => (
                  <SelectItem key={ac.code} value={ac.code}>
                    {ac.code} - {ac.city}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom area code...</SelectItem>
              </SelectContent>
            </Select>
            {areaCode === "custom" && (
              <Input
                placeholder="Enter 3-digit area code"
                value={customAreaCode}
                onChange={(e) => setCustomAreaCode(e.target.value.replace(/\D/g, "").slice(0, 3))}
                maxLength={3}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname (Optional)</Label>
            <Input
              id="nickname"
              placeholder="e.g., Main Line, Sales"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inbound-agent">Inbound Agent (Optional)</Label>
            <Select value={inboundAgentId} onValueChange={setInboundAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an agent for inbound calls" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No agent assigned</SelectItem>
                {agents?.filter(a => a.retell_agent_id).map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Only agents synced with Retell can be assigned
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="outbound-agent">Outbound Agent (Optional)</Label>
            <Select value={outboundAgentId} onValueChange={setOutboundAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an agent for outbound calls" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No agent assigned</SelectItem>
                {agents?.filter(a => a.retell_agent_id).map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPurchasing}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPurchasing}>
              {isPurchasing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Purchasing...
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  Purchase Number
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
