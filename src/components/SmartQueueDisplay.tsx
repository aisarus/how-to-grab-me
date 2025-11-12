import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SmartQueueResult {
  priorityScore: number;
  shouldOptimize: boolean;
  clarityScore: number;
  structureScore: number;
  constraintsScore: number;
}

interface SmartQueueDisplayProps {
  result: SmartQueueResult;
}

export const SmartQueueDisplay = ({ result }: SmartQueueDisplayProps) => {
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
          Smart Queue Analysis
        </CardTitle>
        <CardDescription>
          Automatic prioritization based on prompt quality metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Priority Score</p>
            <p className="text-xs text-muted-foreground">
              Formula: 0.5×(1−Clarity) + 0.3×(1−Structure) + 0.2×(1−Constraints)
            </p>
          </div>
          <Badge className={getPriorityColor(result.priorityScore)} variant="outline">
            {result.priorityScore.toFixed(3)}
          </Badge>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          {result.shouldOptimize ? (
            <>
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Optimization Required</p>
                <p className="text-xs text-muted-foreground">
                  Priority score below 0.85 threshold - routing to PCV
                </p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Optimization Skipped</p>
                <p className="text-xs text-muted-foreground">
                  Prompt quality sufficient - marked as optimized_by_default
                </p>
              </div>
            </>
          )}
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Clarity</span>
              <span className={getScoreColor(result.clarityScore)}>
                {(result.clarityScore * 100).toFixed(0)}%
              </span>
            </div>
            <Progress value={result.clarityScore * 100} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Structure</span>
              <span className={getScoreColor(result.structureScore)}>
                {(result.structureScore * 100).toFixed(0)}%
              </span>
            </div>
            <Progress value={result.structureScore * 100} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Constraints</span>
              <span className={getScoreColor(result.constraintsScore)}>
                {(result.constraintsScore * 100).toFixed(0)}%
              </span>
            </div>
            <Progress value={result.constraintsScore * 100} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
