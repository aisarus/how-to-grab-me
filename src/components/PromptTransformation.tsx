import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, GitCompare, CheckCircle2 } from 'lucide-react';

interface QualityScores {
  clarity: number;
  structure: number;
  constraints: number;
  taskDefinition: number;
  ambiguity: number;
}

interface PromptTransformationProps {
  originalPrompt: string;
  optimizedPrompt: string;
  originalTokens: number;
  optimizedTokens: number;
  beforeScores: QualityScores;
  afterScores: QualityScores;
}

function ScoreBar({ label, before, after }: { label: string; before: number; after: number }) {
  const improvement = after - before;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2 font-mono">
          <span className="text-muted-foreground">{Math.round(before)}</span>
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
          <span className={after >= 70 ? 'text-green-500' : after >= 40 ? 'text-yellow-500' : 'text-destructive'}>
            {Math.round(after)}
          </span>
          {improvement > 0 && (
            <span className="text-green-500 text-[10px]">+{Math.round(improvement)}</span>
          )}
        </div>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        {/* Before (faded) */}
        <div
          className="absolute inset-y-0 left-0 bg-muted-foreground/20 rounded-full transition-all"
          style={{ width: `${before}%` }}
        />
        {/* After */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all bg-primary"
          style={{ width: `${after}%` }}
        />
      </div>
    </div>
  );
}

export const PromptTransformation = ({
  originalPrompt,
  optimizedPrompt,
  originalTokens,
  optimizedTokens,
  beforeScores,
  afterScores,
}: PromptTransformationProps) => {
  const overallBefore = Math.round(
    (beforeScores.clarity + beforeScores.structure + beforeScores.constraints + beforeScores.taskDefinition + beforeScores.ambiguity) / 5
  );
  const overallAfter = Math.round(
    (afterScores.clarity + afterScores.structure + afterScores.constraints + afterScores.taskDefinition + afterScores.ambiguity) / 5
  );

  return (
    <Card className="border border-border shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <GitCompare className="w-4 h-4 text-primary" />
          Prompt Transformation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Original */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Original Prompt</span>
              <Badge variant="secondary" className="text-[10px] font-mono">{originalTokens} tokens</Badge>
            </div>
            <ScrollArea className="h-48 border rounded-lg p-3 bg-muted/30">
              <p className="text-sm whitespace-pre-wrap font-mono leading-relaxed">{originalPrompt}</p>
            </ScrollArea>
          </div>

          {/* Optimized */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary">Optimized Prompt</span>
              <Badge className="text-[10px] font-mono">{optimizedTokens} tokens</Badge>
            </div>
            <ScrollArea className="h-48 border-2 border-primary/30 rounded-lg p-3 bg-primary/5">
              <p className="text-sm whitespace-pre-wrap font-mono leading-relaxed">{optimizedPrompt}</p>
            </ScrollArea>
          </div>
        </div>

        {/* Quality Score Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Before Quality Score</span>
              <span className={`text-lg font-bold tabular-nums ${overallBefore >= 60 ? 'text-green-500' : overallBefore >= 35 ? 'text-yellow-500' : 'text-destructive'}`}>
                {overallBefore}/100
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-primary">After Quality Score</span>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold tabular-nums ${overallAfter >= 60 ? 'text-green-500' : 'text-yellow-500'}`}>
                  {overallAfter}/100
                </span>
                {overallAfter > overallBefore && (
                  <Badge variant="outline" className="text-green-500 border-green-500/30 text-[10px]">
                    <CheckCircle2 className="w-3 h-3 mr-0.5" />
                    +{overallAfter - overallBefore}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sub-metric progress bars */}
        <div className="space-y-2 pt-2">
          <ScoreBar label="Clarity" before={beforeScores.clarity} after={afterScores.clarity} />
          <ScoreBar label="Structure" before={beforeScores.structure} after={afterScores.structure} />
          <ScoreBar label="Constraints" before={beforeScores.constraints} after={afterScores.constraints} />
          <ScoreBar label="Task Definition" before={beforeScores.taskDefinition} after={afterScores.taskDefinition} />
          <ScoreBar label="Ambiguity (low = bad)" before={beforeScores.ambiguity} after={afterScores.ambiguity} />
        </div>
      </CardContent>
    </Card>
  );
};
