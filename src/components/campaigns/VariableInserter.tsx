import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Variable } from "lucide-react";

interface VariableInserterProps {
  onInsert: (variable: string) => void;
}

const variables = [
  { label: "First Name", value: "{{first_name}}" },
  { label: "Last Name", value: "{{last_name}}" },
  { label: "Service", value: "{{service}}" },
  { label: "Business Name", value: "{{business_name}}" },
  { label: "Agent Name", value: "{{agent_name}}" },
  { label: "Address", value: "{{address}}" },
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
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground px-2 py-1">
            Template Variables
          </p>
          {variables.map((v) => (
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
      </PopoverContent>
    </Popover>
  );
};

export default VariableInserter;
