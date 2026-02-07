import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Play, Pause, Edit, Copy, Trash2, MoreVertical, Clock, MessageSquare } from "lucide-react";
import { SmsCampaign } from "@/hooks/useSmsCampaigns";
import { formatDistanceToNow } from "date-fns";

interface CampaignCardProps {
  campaign: SmsCampaign;
  onClick: () => void;
  onEdit: () => void;
  onClone: () => void;
  onDelete: () => void;
  isCloning: boolean;
}

const statusBadge = (campaign: SmsCampaign) => {
  if (campaign.is_active) {
    return (
      <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30">
        <Play className="w-3 h-3 mr-1" />
        Active
      </Badge>
    );
  }
  if (campaign.steps && campaign.steps.length > 0) {
    return (
      <Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">
        <Pause className="w-3 h-3 mr-1" />
        Paused
      </Badge>
    );
  }
  return <Badge variant="secondary">Draft</Badge>;
};

const CampaignCard = ({
  campaign,
  onClick,
  onEdit,
  onClone,
  onDelete,
  isCloning,
}: CampaignCardProps) => {
  return (
    <Card
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
      data-testid={`card-campaign-${campaign.id}`}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base truncate" data-testid={`text-campaign-name-${campaign.id}`}>
            {campaign.name}
          </CardTitle>
        </div>
        <div className="flex items-center gap-1.5">
          {statusBadge(campaign)}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}
                data-testid={`button-campaign-menu-${campaign.id}`}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onEdit} data-testid={`menu-edit-${campaign.id}`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onClone} disabled={isCloning} data-testid={`menu-clone-${campaign.id}`}>
                <Copy className="w-4 h-4 mr-2" />
                Clone
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onDelete}
                data-testid={`menu-delete-${campaign.id}`}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {campaign.description && (
          <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-campaign-desc-${campaign.id}`}>
            {campaign.description}
          </p>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1" data-testid={`text-campaign-steps-${campaign.id}`}>
            <MessageSquare className="w-3 h-3" />
            {campaign.steps?.length ?? 0} steps
          </span>
          <span className="flex items-center gap-1" data-testid={`text-campaign-date-${campaign.id}`}>
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignCard;
