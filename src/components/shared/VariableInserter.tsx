import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Variable, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { templateVariableGroups, VariableGroup } from "@/lib/templateVariables";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface VariableInserterProps {
  onInsert: (variable: string) => void;
  /** Filter to specific variable groups by label */
  groups?: string[];
  /** Compact mode for smaller spaces */
  compact?: boolean;
  /** Custom trigger text */
  triggerText?: string;
  /** Button variant */
  variant?: "default" | "outline" | "ghost" | "secondary";
}

const sourceColors: Record<string, string> = {
  lead: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  business: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  conversation: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  system: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const VariableInserter = ({ 
  onInsert, 
  groups, 
  compact = false,
  triggerText = "Insert Variable",
  variant = "outline"
}: VariableInserterProps) => {
  // Filter groups if specified
  const displayGroups: VariableGroup[] = groups 
    ? templateVariableGroups.filter(g => groups.includes(g.label))
    : templateVariableGroups;

  return (
    <TooltipProvider>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant={variant} size={compact ? "sm" : "default"} data-testid="button-insert-variable">
            <Variable className={cn("w-4 h-4", !compact && "mr-2")} />
            {!compact && triggerText}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b bg-muted/50">
            <h4 className="font-medium text-sm">Template Variables</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Insert dynamic values from lead data & business profile
            </p>
          </div>
          <ScrollArea className="h-80">
            <div className="p-2 space-y-1">
              {displayGroups.map((group, gi) => (
                <div key={group.label}>
                  {gi > 0 && <Separator className="my-2" />}
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {group.label}
                    </p>
                    {group.description && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[200px]">
                          <p className="text-xs">{group.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  {group.variables.map((v) => (
                    <Tooltip key={v.value}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onInsert(v.value)}
                          className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors flex items-center justify-between group"
                          data-testid={`button-variable-${v.label.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium truncate">{v.label}</span>
                            <Badge 
                              variant="secondary" 
                              className={cn("text-[10px] px-1.5 py-0 h-4", sourceColors[v.source])}
                            >
                              {v.source}
                            </Badge>
                          </div>
                          <span className="text-muted-foreground text-xs font-mono opacity-60 group-hover:opacity-100 transition-opacity">
                            {v.value}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[200px]">
                        <p className="text-xs">{v.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
};

export default VariableInserter;
