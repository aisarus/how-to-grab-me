import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, MessageSquare, GitBranch, Package } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
  
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          {t('modules.title')}
        </CardTitle>
        <CardDescription>
          {t('modules.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center gap-2 flex-1">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label htmlFor="smart-queue" className="text-sm font-medium">
                {t('modules.smartQueue')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('modules.smartQueueDesc')}
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
                {t('modules.explainMode')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('modules.explainModeDesc')}
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
                {t('modules.versioning')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('modules.versioningDesc')}
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
