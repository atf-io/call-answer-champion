import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LucideIcon } from "lucide-react";

interface EditableFieldProps {
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  icon?: LucideIcon;
  placeholder?: string;
  multiline?: boolean;
  disabled?: boolean;
}

export const EditableField = ({
  label,
  value,
  onChange,
  icon: Icon,
  placeholder,
  multiline,
  disabled,
}: EditableFieldProps) => {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-muted-foreground flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </Label>
      {multiline ? (
        <Textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          disabled={disabled}
        />
      ) : (
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
      )}
    </div>
  );
};
