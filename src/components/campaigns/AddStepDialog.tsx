import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import VariableInserter from "./VariableInserter";

interface AddStepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddStep: (data: {
    delay_days: number;
    delay_hours: number;
    delay_minutes: number;
    message_template: string;
  }) => Promise<void>;
}

const AddStepDialog = ({
  open,
  onOpenChange,
  onAddStep,
}: AddStepDialogProps) => {
  const [newDelayDays, setNewDelayDays] = useState(0);
  const [newDelayHours, setNewDelayHours] = useState(0);
  const [newDelayMinutes, setNewDelayMinutes] = useState(0);
  const [newStepMessage, setNewStepMessage] = useState("");

  const handleAddStep = async () => {
    if (!newStepMessage.trim()) return;
    await onAddStep({
      delay_days: newDelayDays,
      delay_hours: newDelayHours,
      delay_minutes: newDelayMinutes,
      message_template: newStepMessage.trim(),
    });
    setNewDelayDays(0);
    setNewDelayHours(0);
    setNewDelayMinutes(0);
    setNewStepMessage("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Step</DialogTitle>
          <DialogDescription>
            Add a new message step to the campaign sequence.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Delay</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Days</Label>
                <Input 
                  type="number" 
                  min={0} 
                  value={newDelayDays} 
                  onChange={(e) => setNewDelayDays(Number(e.target.value) || 0)} 
                  data-testid="input-new-step-days" 
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Hours</Label>
                <Input 
                  type="number" 
                  min={0} 
                  max={23} 
                  value={newDelayHours} 
                  onChange={(e) => setNewDelayHours(Number(e.target.value) || 0)} 
                  data-testid="input-new-step-hours" 
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Minutes</Label>
                <Input 
                  type="number" 
                  min={0} 
                  max={59} 
                  value={newDelayMinutes} 
                  onChange={(e) => setNewDelayMinutes(Number(e.target.value) || 0)} 
                  data-testid="input-new-step-minutes" 
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Time to wait before sending this message after the previous step.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Label htmlFor="step-message">Message Template</Label>
              <VariableInserter onInsert={(v) => setNewStepMessage((prev) => {
                if (prev.length === 0 || prev.endsWith(" ") || prev.endsWith("\n")) return prev + v;
                return prev + " " + v;
              })} />
            </div>
            <Textarea
              id="step-message"
              value={newStepMessage}
              onChange={(e) => setNewStepMessage(e.target.value)}
              placeholder="Type your message..."
              rows={4}
              data-testid="textarea-new-step-message"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-add-step">
            Cancel
          </Button>
          <Button
            onClick={handleAddStep}
            disabled={!newStepMessage.trim()}
            data-testid="button-confirm-add-step"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Step
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddStepDialog;
