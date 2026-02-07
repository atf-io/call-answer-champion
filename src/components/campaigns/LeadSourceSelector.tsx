import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const LEAD_SOURCES = [
  { id: "angi", label: "Angi" },
  { id: "thumbtack", label: "Thumbtack" },
  { id: "google_lsa", label: "Google LSA" },
  { id: "modernize", label: "Modernize" },
  { id: "nextdoor", label: "Nextdoor" },
  { id: "homeadvisor", label: "HomeAdvisor" },
  { id: "yelp", label: "Yelp" },
  { id: "zillow", label: "Zillow" },
  { id: "manual", label: "Manual" },
] as const;

export type LeadSourceId = typeof LEAD_SOURCES[number]["id"];

interface LeadSourceSelectorProps {
  selectedSources: string[];
  onSelectionChange: (sources: string[]) => void;
  disabled?: boolean;
}

const LeadSourceSelector = ({
  selectedSources,
  onSelectionChange,
  disabled = false,
}: LeadSourceSelectorProps) => {
  const handleToggle = (sourceId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedSources, sourceId]);
    } else {
      onSelectionChange(selectedSources.filter((s) => s !== sourceId));
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {LEAD_SOURCES.map((source) => (
          <div key={source.id} className="flex items-center space-x-2">
            <Checkbox
              id={`lead-source-${source.id}`}
              checked={selectedSources.includes(source.id)}
              onCheckedChange={(checked) => handleToggle(source.id, !!checked)}
              disabled={disabled}
              data-testid={`checkbox-lead-source-${source.id}`}
            />
            <Label
              htmlFor={`lead-source-${source.id}`}
              className="text-sm font-normal cursor-pointer"
            >
              {source.label}
            </Label>
          </div>
        ))}
      </div>
      {selectedSources.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No sources selected. Leads from any source will not trigger this campaign.
        </p>
      )}
      {selectedSources.length > 0 && (
        <p className="text-xs text-muted-foreground">
          This campaign will trigger for leads from: {selectedSources.map(s => LEAD_SOURCES.find(ls => ls.id === s)?.label).filter(Boolean).join(", ")}
        </p>
      )}
    </div>
  );
};

export { LEAD_SOURCES };
export default LeadSourceSelector;
