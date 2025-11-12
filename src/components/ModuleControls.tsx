import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, MessageSquare, GitBranch, Package } from 'lucide-react';

interface ModuleControlsProps {
  smartQueueEnabled: boolean;
  explainModeEnabled: boolean;
  versioningEnabled: boolean;
  onSmartQueueToggle: (enabled: boolean) => void;
  onExplainModeToggle: (enabled: boolean) => void;
  onVersioningToggle: (enabled: boolean) => void;
}

export const ModuleControls = ({
  smartQueueEnabled,
  explainModeEnabled,
  versioningEnabled,
  onSmartQueueToggle,
  onExplainModeToggle,
  onVersioningToggle,
}: ModuleControlsProps) => {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          PromptOps Modules
        </CardTitle>
        <CardDescription>
          Control which optimization modules are active
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center gap-2 flex-1">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label htmlFor="smart-queue" className="text-sm font-medium">
                Smart Queue
              </Label>
              <p className="text-xs text-muted-foreground">
                Auto-detect if prompts need optimization (priority score ≥ 0.85 skips)
              </p>
            </div>
          </div>
          <Switch
            id="smart-queue"
            checked={smartQueueEnabled}
            onCheckedChange={onSmartQueueToggle}
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center gap-2 flex-1">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label htmlFor="explain-mode" className="text-sm font-medium">
                Explain Mode
              </Label>
              <p className="text-xs text-muted-foreground">
                Generate explanations (≤150 words) for each optimization iteration
              </p>
            </div>
          </div>
          <Switch
            id="explain-mode"
            checked={explainModeEnabled}
            onCheckedChange={onExplainModeToggle}
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center gap-2 flex-1">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label htmlFor="versioning" className="text-sm font-medium">
                Versioning & Review
              </Label>
              <p className="text-xs text-muted-foreground">
                Track prompt versions with accept/reject/rollback capabilities
              </p>
            </div>
          </div>
          <Switch
            id="versioning"
            checked={versioningEnabled}
            onCheckedChange={onVersioningToggle}
          />
        </div>
      </CardContent>
    </Card>
  );
};
