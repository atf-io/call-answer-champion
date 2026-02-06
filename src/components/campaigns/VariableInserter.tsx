import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Variable } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface VariableInserterProps {
  onInsert: (variable: string) => void;
}

const variableGroups = [
  {
    label: "Lead Info",
    variables: [
      { label: "First Name", value: "{{first_name}}" },
      { label: "Last Name", value: "{{last_name}}" },
      { label: "Full Name", value: "{{full_name}}" },
      { label: "Phone", value: "{{phone}}" },
      { label: "Email", value: "{{email}}" },
      { label: "Lead Source", value: "{{lead_source}}" },
    ],
  },
  {
    label: "Service Details",
    variables: [
      { label: "Service Category", value: "{{service_category}}" },
      { label: "Task Name", value: "{{task_name}}" },
      { label: "Comments", value: "{{comments}}" },
    ],
  },
  {
    label: "Location",
    variables: [
      { label: "Address", value: "{{address}}" },
      { label: "Postal Code", value: "{{postal_code}}" },
    ],
  },
  {
    label: "Business",
    variables: [
      { label: "Business Name", value: "{{business_name}}" },
      { label: "Agent Name", value: "{{agent_name}}" },
    ],
  },
];

const VariableInserter = ({ onInsert }: VariableInserterProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-insert-variable">
          <Variable className="w-4 h-4 mr-2" />
          Insert Variable
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <ScrollArea className="max-h-72">
          <div className="space-y-1">
            {variableGroups.map((group, gi) => (
              <div key={group.label}>
                {gi > 0 && <Separator className="my-1.5" />}
                <p className="text-xs font-semibold text-muted-foreground px-2 py-1">
                  {group.label}
                </p>
                {group.variables.map((v) => (
                  <button
                    key={v.value}
                    onClick={() => onInsert(v.value)}
                    className="w-full text-left px-2 py-1.5 text-sm rounded-md hover-elevate transition-colors"
                    data-testid={`button-variable-${v.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <span className="font-medium">{v.label}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{v.value}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default VariableInserter;
