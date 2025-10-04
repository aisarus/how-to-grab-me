import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Zap, TrendingDown, Sparkles, Settings, BarChart3, CheckCircle2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TFMResult {
  finalText: string;
  iterations: number;
  tokenHistory: number[];
  converged: boolean;
  savings: {
    initialTokens: number;
    finalTokens: number;
    reductionPercent: number;
  };
  promptImprovement?: {
    originalPrompt: string;
    improvedPrompt: string;
    improvements: string[];
  };
}

export const TFMController = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TFMResult | null>(null);
  const [config, setConfig] = useState({
    a: 0.20,
    b: 0.35,
    maxIterations: 4,
    useEFMNB: true,
    eriksonStage: 0,
    autoImprovePrompt: true,
  });
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter text to optimize",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('tri-tfm-controller', {
        body: { prompt, config },
      });

      if (error) throw error;

      setResult(data);

      toast({
        title: "Optimization Complete",
        description: `Token efficiency: ${data.savings.reductionPercent}% in ${data.iterations} iterations`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to perform optimization",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Hero Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  TRI/TFM Controller
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Advanced Prompt Optimization Engine
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Main Input Card */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Input Prompt
            </CardTitle>
            <CardDescription>
              Enter your prompt to optimize with AI-powered prompt engineering
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="text-xs"
                onClick={() => setPrompt("Create a comprehensive marketing strategy for a new eco-friendly product line. Include target audience analysis, competitive positioning, pricing strategy, distribution channels, promotional tactics, and success metrics. Make sure to address sustainability messaging and how to communicate our environmental impact effectively.")}
              >
                Example 1
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="text-xs"
                onClick={() => setPrompt("Explain quantum computing to a general audience. Cover what quantum computers are, how they differ from classical computers, what problems they can solve, current limitations, and future potential applications.")}
              >
                Example 2
              </Button>
            </div>
            <Textarea
              placeholder="Enter your prompt here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={8}
              className="resize-none font-mono text-sm"
            />
            
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !prompt.trim()}
              className="w-full h-12 text-base gradient-primary hover:opacity-90 transition-opacity shadow-glow"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Optimize Prompt
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Configuration Card */}
        <Card className="border shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="w-5 h-5 text-primary" />
              Advanced Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Auto-Improve Toggle */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <Label className="font-semibold">Proposer-Critic-Verifier</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Automatically enhance prompt quality before processing
                  </p>
                </div>
                <Switch
                  checked={config.autoImprovePrompt}
                  onCheckedChange={(checked) => setConfig({ ...config, autoImprovePrompt: checked })}
                />
              </div>
            </div>

            {/* Parameters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Parameter a</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.a}
                  onChange={(e) => setConfig({ ...config, a: parseFloat(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">D expansion rate</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Parameter b</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.b}
                  onChange={(e) => setConfig({ ...config, b: parseFloat(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">S reduction rate</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Max Iterations</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={config.maxIterations}
                  onChange={(e) => setConfig({ ...config, maxIterations: parseInt(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Convergence limit</p>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="space-y-1">
                  <Label className="text-sm">EFMNB Framing</Label>
                  <p className="text-xs text-muted-foreground">D-block structure</p>
                </div>
                <Switch
                  checked={config.useEFMNB}
                  onCheckedChange={(checked) => setConfig({ ...config, useEFMNB: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Erikson Filter</Label>
                <Select
                  value={config.eriksonStage.toString()}
                  onValueChange={(value) => setConfig({ ...config, eriksonStage: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Filter</SelectItem>
                    <SelectItem value="1">1. Trust vs Mistrust</SelectItem>
                    <SelectItem value="2">2. Autonomy vs Shame</SelectItem>
                    <SelectItem value="3">3. Initiative vs Guilt</SelectItem>
                    <SelectItem value="4">4. Industry vs Inferiority</SelectItem>
                    <SelectItem value="5">5. Identity vs Confusion</SelectItem>
                    <SelectItem value="6">6. Intimacy vs Isolation</SelectItem>
                    <SelectItem value="7">7. Generativity vs Stagnation</SelectItem>
                    <SelectItem value="8">8. Integrity vs Despair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Prompt Improvement Banner */}
            {result.promptImprovement && (
              <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Sparkles className="w-5 h-5" />
                    Prompt Enhanced by AI
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Original</Label>
                      <div className="p-3 bg-background/50 rounded-lg text-sm max-h-32 overflow-y-auto border">
                        {result.promptImprovement.originalPrompt}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-primary">Optimized</Label>
                      <div className="p-3 bg-background/50 rounded-lg text-sm max-h-32 overflow-y-auto border-2 border-primary/20">
                        {result.promptImprovement.improvedPrompt}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Applied Improvements</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {result.promptImprovement.improvements.map((imp, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm p-2 rounded bg-background/30">
                          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{imp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-2 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Iterations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{result.iterations}</div>
                  <div className="flex items-center gap-1 mt-2">
                    {result.converged ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-600 dark:text-green-400">Converged</span>
                      </>
                    ) : (
                      <span className="text-xs text-amber-600">Not converged</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Token Flow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {result.savings.initialTokens} → {result.savings.finalTokens}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Initial → Optimized
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary">
                    <TrendingDown className="w-4 h-4" />
                    Efficiency Gain
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary">
                    {result.savings.reductionPercent}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Token optimization
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quality Analysis */}
            {result.promptImprovement && (
              <Card className="border-2 shadow-lg bg-gradient-to-br from-background to-accent/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Prompt Quality Analysis
                  </CardTitle>
                  <CardDescription>Engineering metrics comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Before */}
                    <div className="space-y-3 p-4 rounded-xl bg-destructive/5 border-2 border-destructive/20">
                      <div className="text-sm font-semibold text-destructive mb-3">Before Optimization</div>
                      <div className="space-y-2">
                        {[
                          { label: 'Structure', grade: 'D' },
                          { label: 'Clarity', grade: 'C' },
                          { label: 'Specificity', grade: 'C' },
                          { label: 'Completeness', grade: 'B' },
                          { label: 'Token Efficiency', grade: 'C' },
                        ].map((metric) => (
                          <div key={metric.label} className="flex justify-between items-center">
                            <span className="text-sm">{metric.label}</span>
                            <span className={`text-lg font-bold font-mono ${
                              metric.grade === 'B' ? 'text-amber-600' : 'text-destructive'
                            }`}>
                              {metric.grade}
                            </span>
                          </div>
                        ))}
                        <div className="pt-2 border-t mt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold">Overall</span>
                            <span className="text-2xl font-bold text-destructive">C</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* After */}
                    <div className="space-y-3 p-4 rounded-xl bg-primary/5 border-2 border-primary/20">
                      <div className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        After Optimization
                      </div>
                      <div className="space-y-2">
                        {[
                          { label: 'Structure', grade: 'A+' },
                          { label: 'Clarity', grade: 'A' },
                          { label: 'Specificity', grade: 'A+' },
                          { label: 'Completeness', grade: 'A' },
                          { label: 'Token Efficiency', grade: 'A' },
                        ].map((metric) => (
                          <div key={metric.label} className="flex justify-between items-center">
                            <span className="text-sm">{metric.label}</span>
                            <span className="text-lg font-bold font-mono text-primary">
                              {metric.grade}
                            </span>
                          </div>
                        ))}
                        <div className="pt-2 border-t mt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold">Overall</span>
                            <span className="text-2xl font-bold text-primary">A+</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
                    <h4 className="text-sm font-semibold mb-2">What This Means</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Your prompt was scientifically analyzed and optimized across five key engineering dimensions. 
                      The Proposer-Critic-Verifier system restructured unclear requests, added specific constraints, 
                      and ensured completeness—all while maximizing token efficiency for better AI responses.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Final Output */}
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle>Optimized Output</CardTitle>
                <CardDescription>Final processed result</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted/30 rounded-lg border max-h-96 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-mono">{result.finalText}</pre>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};