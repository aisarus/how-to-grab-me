import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, ListOrdered, CheckCircle2, Activity } from 'lucide-react';

interface IterationEntry {
  iteration: number;
  qualityScore?: number;
  changes: string[];
}

interface IterationLogProps {
  iterations: number;
  converged: boolean;
  scoreDelta?: number;
  explanations?: Array<{
    mainIssues: string[];
    keyTransformations: string[];
    expectedEffects: string[];
    fullExplanation: string;
  }>;
  modeFreeMetrics?: {
    qualityGainPercent: number;
    judgeVotes: number[];
  };
}

export const IterationLog = ({ iterations, converged, scoreDelta, explanations, modeFreeMetrics }: IterationLogProps) => {
  const [open, setOpen] = useState(false);

  // Build iteration entries from available data
  const entries: IterationEntry[] = [];
  for (let i = 0; i < iterations; i++) {
    const explanation = explanations?.[i];
    const vote = modeFreeMetrics?.judgeVotes?.[i];
    const changes = explanation?.keyTransformations || 
      (explanation?.mainIssues?.map(issue => `Fixed: ${issue}`) || []);
    
    entries.push({
      iteration: i + 1,
      qualityScore: vote != null ? Math.round(vote * 100) : undefined,
      changes: changes.length > 0 ? changes : ['Processing iteration...'],
    });
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <ListOrdered className="w-4 h-4 text-primary" />
                Optimization Log
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {iterations} iterations
                </Badge>
                {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </Button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            {entries.map(entry => (
              <div key={entry.iteration} className="flex gap-3 text-sm">
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">
                    {entry.iteration}
                  </div>
                  {entry.iteration < iterations && (
                    <div className="w-px flex-1 bg-border mt-1" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Iteration {entry.iteration}</span>
                    {entry.qualityScore != null && (
                      <span className="text-xs font-mono text-muted-foreground">
                        quality: {entry.qualityScore}%
                      </span>
                    )}
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {entry.changes.slice(0, 3).map((change, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Activity className="w-3 h-3 mt-0.5 shrink-0 text-primary/50" />
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}

            {/* Convergence footer */}
            <div className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium ${
              converged 
                ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              {converged 
                ? `Convergence detected${scoreDelta != null ? ` (Δ = ${scoreDelta.toFixed(3)})` : ''}`
                : `Max iterations reached without convergence`
              }
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
