import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';

interface SmartQueueResult {
  priorityScore: number;
  shouldOptimize: boolean;
  clarityScore: number;
  structureScore: number;
  constraintsScore: number;
  mockMode?: boolean;
}

interface SmartQueueDisplayProps {
  result: SmartQueueResult;
}

export const SmartQueueDisplay = ({ result }: SmartQueueDisplayProps) => {
  const { t } = useLanguage();
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getPriorityColor = (priority: number) => {
    if (priority < 0.85) return 'bg-red-500/20 text-red-700 border-red-500/30';
    return 'bg-green-500/20 text-green-700 border-green-500/30';
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {t('smartQueue.title')}
        </CardTitle>
        <CardDescription>
          {t('smartQueue.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">{t('smartQueue.priorityScore')}</p>
            <p className="text-xs text-muted-foreground">
              {t('smartQueue.formula')}
            </p>
          </div>
          <Badge className={getPriorityColor(result.priorityScore ?? 0)} variant="outline">
            {result.priorityScore?.toFixed(3) ?? 'N/A'}
          </Badge>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          {result.shouldOptimize ? (
            <>
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">{t('smartQueue.optimizationRequired')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('smartQueue.routingToPCV')}
                </p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">{t('smartQueue.optimizationSkipped')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('smartQueue.sufficientQuality')}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{t('smartQueue.clarity')}</span>
              <span className={getScoreColor(result.clarityScore ?? 0)}>
                {((result.clarityScore ?? 0) * 100).toFixed(0)}%
              </span>
            </div>
            <Progress value={(result.clarityScore ?? 0) * 100} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{t('smartQueue.structure')}</span>
              <span className={getScoreColor(result.structureScore ?? 0)}>
                {((result.structureScore ?? 0) * 100).toFixed(0)}%
              </span>
            </div>
            <Progress value={(result.structureScore ?? 0) * 100} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{t('smartQueue.constraints')}</span>
              <span className={getScoreColor(result.constraintsScore ?? 0)}>
                {((result.constraintsScore ?? 0) * 100).toFixed(0)}%
              </span>
            </div>
            <Progress value={(result.constraintsScore ?? 0) * 100} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
