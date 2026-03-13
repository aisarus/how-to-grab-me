import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, RotateCw, TrendingDown } from 'lucide-react';

interface ConvergenceIndicatorProps {
  iterations: number;
  maxIterations: number;
  converged: boolean;
  scoreDelta?: number;
  qualityGainPercent?: number;
}

export const ConvergenceIndicator = ({
  iterations,
  maxIterations,
  converged,
  scoreDelta,
  qualityGainPercent,
}: ConvergenceIndicatorProps) => {
  return (
    <Card className="border border-border">
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Iterations:</span>
              <span className="font-mono font-bold">{iterations}/{maxIterations}</span>
            </div>

            {scoreDelta != null && (
              <div className="flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Score Δ:</span>
                <span className="font-mono font-bold">{scoreDelta.toFixed(4)}</span>
              </div>
            )}

            {qualityGainPercent != null && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">QG%:</span>
                <span className={`font-mono font-bold ${qualityGainPercent >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                  {qualityGainPercent > 0 ? '+' : ''}{qualityGainPercent.toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          <Badge
            variant="outline"
            className={`gap-1 text-xs ${
              converged
                ? 'border-green-500/30 text-green-500'
                : 'border-yellow-500/30 text-yellow-500'
            }`}
          >
            {converged ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                Converged
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3" />
                Not Converged
              </>
            )}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
