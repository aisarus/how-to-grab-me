import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Stethoscope, AlertTriangle, CheckCircle2, Code2, PenTool, BarChart3, FileQuestion, Lightbulb, Layers } from 'lucide-react';

interface DiagnosticScores {
  clarity: number;
  structure: number;
  constraints: number;
  taskDefinition: number;
  ambiguity: number;
}

interface PromptDiagnosticsProps {
  prompt: string;
  smartQueueScores?: {
    clarityScore: number;
    structureScore: number;
    constraintsScore: number;
  };
  complexityScore?: number;
  taskType?: 'creative' | 'technical';
  detectedCategory?: string;
}

const TASK_CATEGORIES = [
  { key: 'coding', label: 'Coding', icon: Code2, patterns: ['code', 'function', 'api', 'debug', 'implement', 'refactor', 'typescript', 'javascript', 'python', 'react', 'программ', 'код', 'функци'] },
  { key: 'analysis', label: 'Analysis', icon: BarChart3, patterns: ['analyze', 'analysis', 'compare', 'evaluate', 'assess', 'report', 'data', 'metrics', 'statistics', 'анализ', 'сравн', 'оцен', 'отчет'] },
  { key: 'creative', label: 'Creative Writing', icon: PenTool, patterns: ['write', 'story', 'creative', 'narrative', 'poem', 'essay', 'blog', 'content', 'напиши', 'рассказ', 'историю', 'креатив', 'сочини'] },
  { key: 'instruction', label: 'Instruction Generation', icon: Layers, patterns: ['guide', 'tutorial', 'step-by-step', 'how to', 'instructions', 'curriculum', 'teach', 'инструкц', 'руководств', 'обучен'] },
  { key: 'data_transform', label: 'Data Transformation', icon: Lightbulb, patterns: ['transform', 'convert', 'migrate', 'format', 'parse', 'extract', 'map', 'преобразов', 'конверт', 'миграц'] },
  { key: 'general', label: 'General Question', icon: FileQuestion, patterns: ['explain', 'what is', 'how does', 'why', 'describe', 'объясни', 'что такое', 'как', 'почему', 'опиши'] },
];

function detectTaskCategory(prompt: string): string {
  const lower = prompt.toLowerCase();
  let best = 'general';
  let bestScore = 0;

  for (const cat of TASK_CATEGORIES) {
    const score = cat.patterns.filter(p => lower.includes(p)).length;
    if (score > bestScore) {
      bestScore = score;
      best = cat.key;
    }
  }
  return best;
}

function computeDiagnostics(prompt: string, smartQueueScores?: PromptDiagnosticsProps['smartQueueScores']): DiagnosticScores {
  const lower = prompt.toLowerCase();
  const words = prompt.split(/\s+/).length;

  // Clarity: sentence length, simple language
  let clarity = Math.min(100, Math.max(10, 
    (smartQueueScores?.clarityScore ?? 50) * (words > 10 ? 1 : 0.5)
  ));

  // Structure: lists, headers, sections
  const hasLists = /^\s*[-•*\d]+[.)]\s/m.test(prompt);
  const hasHeaders = /^#{1,6}\s/m.test(prompt);
  const hasParagraphs = prompt.split(/\n\s*\n/).length > 1;
  let structure = smartQueueScores?.structureScore ?? (
    (hasLists ? 30 : 0) + (hasHeaders ? 30 : 0) + (hasParagraphs ? 20 : 0) + 10
  );
  structure = Math.min(100, Math.max(5, structure));

  // Constraints: explicit boundaries
  const constraintWords = ['must', 'should', 'limit', 'maximum', 'minimum', 'at least', 'no more', 'exactly', 'required', 'обязательно', 'не более', 'максимум', 'минимум'];
  const constraintCount = constraintWords.filter(w => lower.includes(w)).length;
  let constraints = smartQueueScores?.constraintsScore ?? Math.min(100, constraintCount * 20);
  constraints = Math.max(5, constraints);

  // Task definition
  const taskKeywords = ['create', 'build', 'write', 'design', 'implement', 'develop', 'generate', 'analyze', 'explain', 'создай', 'напиши', 'разработай'];
  const taskCount = taskKeywords.filter(w => lower.includes(w)).length;
  const hasOutput = /output|result|format|return|верни|результат|формат/i.test(prompt);
  let taskDefinition = Math.min(100, taskCount * 20 + (hasOutput ? 25 : 0) + (words > 30 ? 15 : 0));
  taskDefinition = Math.max(5, taskDefinition);

  // Ambiguity (inverted = lower is worse)
  const vagueWords = ['something', 'stuff', 'thing', 'maybe', 'kind of', 'sort of', 'etc', 'whatever', 'что-нибудь', 'как-нибудь', 'примерно'];
  const vagueCount = vagueWords.filter(w => lower.includes(w)).length;
  let ambiguity = Math.max(5, Math.min(100, 100 - vagueCount * 25 - (words < 15 ? 30 : 0)));

  return { clarity, structure, constraints, taskDefinition, ambiguity };
}

function getOverallScore(d: DiagnosticScores): number {
  return Math.round((d.clarity + d.structure + d.constraints + d.taskDefinition + d.ambiguity) / 5);
}

function getSeverityLabel(score: number): { label: string; color: string } {
  if (score >= 75) return { label: 'GOOD', color: 'text-green-500' };
  if (score >= 50) return { label: 'MODERATE', color: 'text-yellow-500' };
  if (score >= 25) return { label: 'WEAK', color: 'text-orange-500' };
  return { label: 'CRITICAL', color: 'text-destructive' };
}

export const PromptDiagnostics = ({ prompt, smartQueueScores, complexityScore, taskType }: PromptDiagnosticsProps) => {
  if (!prompt || prompt.trim().length < 20) return null;

  const diagnostics = computeDiagnostics(prompt, smartQueueScores);
  const overall = getOverallScore(diagnostics);
  const category = detectTaskCategory(prompt);
  const catInfo = TASK_CATEGORIES.find(c => c.key === category) || TASK_CATEGORIES[5];
  const CatIcon = catInfo.icon;

  const metrics = [
    { label: 'Clarity', value: diagnostics.clarity, icon: CheckCircle2 },
    { label: 'Structure', value: diagnostics.structure, icon: Layers },
    { label: 'Constraints', value: diagnostics.constraints, icon: AlertTriangle },
    { label: 'Task Definition', value: diagnostics.taskDefinition, icon: Lightbulb },
    { label: 'Ambiguity', value: diagnostics.ambiguity, icon: FileQuestion },
  ];

  return (
    <Card className="border border-border bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-semibold">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-primary" />
            Prompt Diagnostics
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-xs font-mono">
              <CatIcon className="w-3 h-3" />
              {catInfo.label}
            </Badge>
            <div className={`text-lg font-bold tabular-nums ${overall >= 60 ? 'text-green-500' : overall >= 35 ? 'text-yellow-500' : 'text-destructive'}`}>
              {overall}/100
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {metrics.map(m => {
          const severity = getSeverityLabel(m.value);
          const Icon = m.icon;
          return (
            <div key={m.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3 h-3 text-muted-foreground" />
                  <span>{m.label}</span>
                </div>
                <span className={`font-mono font-semibold ${severity.color}`}>{severity.label}</span>
              </div>
              <Progress value={m.value} className="h-1.5" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export { computeDiagnostics, getOverallScore, detectTaskCategory, type DiagnosticScores };
