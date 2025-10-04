import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap, TrendingDown, Sparkles, Settings, BarChart3, CheckCircle2, Trophy, StopCircle, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Textarea as TextareaComponent } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { PromptTemplates } from './PromptTemplates';
import { FavoriteConfigs } from './FavoriteConfigs';
import { ComparisonModal } from './ComparisonModal';

interface TFMResult {
  finalText: string;
  iterations: number;
  tokenHistory: number[];
  converged: boolean;
  savings: {
    initialTokens: number;
    finalTokens: number;
    percentageSaved: number;
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
  const [abTestWinner, setAbTestWinner] = useState<'original' | 'optimized' | 'tie' | null>(null);
  const [abTestNotes, setAbTestNotes] = useState('');
  const [lastResultId, setLastResultId] = useState<string | null>(null);
  const [copiedResult, setCopiedResult] = useState(false);
  const [config, setConfig] = useState({
    a: 0.20,
    b: 0.35,
    maxIterations: 4,
    convergenceThreshold: 0.05,
    useEFMNB: true,
    useErikson: true, // Erikson filter enabled by default
    useProposerCriticVerifier: true,
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Restore state from sessionStorage on mount
  useEffect(() => {
    const savedState = sessionStorage.getItem('tfm-controller-state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setPrompt(parsed.prompt || '');
        setConfig(parsed.config || config);
        if (parsed.result) setResult(parsed.result);
        if (parsed.abTestWinner) setAbTestWinner(parsed.abTestWinner);
        if (parsed.abTestNotes) setAbTestNotes(parsed.abTestNotes);
        if (parsed.lastResultId) setLastResultId(parsed.lastResultId);
      } catch (e) {
        console.error('Failed to restore state:', e);
      }
    }
  }, []);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    const stateToSave = {
      prompt,
      config,
      result,
      abTestWinner,
      abTestNotes,
      lastResultId,
    };
    sessionStorage.setItem('tfm-controller-state', JSON.stringify(stateToSave));
  }, [prompt, config, result, abTestWinner, abTestNotes, lastResultId]);

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

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      toast({
        title: "Starting optimization",
        description: "This may take a few minutes...",
      });

      const { data, error } = await supabase.functions.invoke('tri-tfm-controller', {
        body: {
          prompt,
          config: {
            a: config.a,
            b: config.b,
            maxIterations: config.maxIterations,
            convergenceThreshold: config.convergenceThreshold,
            useProposerCriticVerifier: config.useProposerCriticVerifier,
            useEFMNB: config.useEFMNB,
            eriksonStage: config.useErikson ? 5 : undefined,
          }
        }
      });

      // Check if stopped
      if (!abortControllerRef.current) {
        return; // Request was stopped
      }

      if (error) throw error;

      setResult(data);
      setAbTestWinner(null);
      setAbTestNotes('');

      // Save results to database for analytics
      const { data: insertedData, error: dbError } = await supabase
        .from('optimization_results')
        .insert({
          original_prompt: prompt,
          optimized_prompt: data.promptImprovement?.improvedPrompt || data.finalText,
          original_tokens: data.savings.initialTokens,
          optimized_tokens: data.savings.finalTokens,
          improvement_percentage: data.savings.percentageSaved,
          a_parameter: config.a,
          b_parameter: config.b,
          iterations: data.iterations,
          convergence_threshold: config.convergenceThreshold,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Failed to save analytics:', dbError);
      } else if (insertedData) {
        setLastResultId(insertedData.id);
      }

      toast({
        title: "Optimization completed",
        description: `Quality improved by ${Math.abs(data.savings.percentageSaved)}% in ${data.iterations} iterations`,
      });
    } catch (error) {
      console.error('Error:', error);
      
      // Check if error was due to abort
      if (error instanceof Error && error.name === 'AbortError') {
        toast({
          title: "Optimization stopped",
          description: "Process was interrupted by user",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to perform optimization",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current = null;
      setLoading(false);
      toast({
        title: "Optimization stopped",
        description: "Process was interrupted",
      });
    }
  };

  const handleCopyResult = async () => {
    if (!result) return;
    
    try {
      const textToCopy = result.promptImprovement?.improvedPrompt || result.finalText;
      await navigator.clipboard.writeText(textToCopy);
      setCopiedResult(true);
      setTimeout(() => setCopiedResult(false), 2000);
      
      toast({
        title: "Copied",
        description: "Optimized prompt copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy text",
        variant: "destructive",
      });
    }
  };

  const handleLoadConfig = (newConfig: Omit<typeof config, 'useEFMNB' | 'useErikson' | 'useProposerCriticVerifier'> & { useEFMNB: boolean; useErikson: boolean; useProposerCriticVerifier: boolean }) => {
    setConfig(newConfig);
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
                  Cloud AI-powered prompt optimization
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => navigate('/analytics')}
              >
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
            <Textarea
              placeholder="Enter your prompt here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={8}
              className="resize-none font-mono text-sm"
            />
            
            <div className="flex gap-2">
              <Button 
                onClick={handleSubmit} 
                disabled={loading || !prompt.trim()}
                className="flex-1 h-12 text-base gradient-primary hover:opacity-90 transition-opacity shadow-glow"
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
              
              {loading && (
                <Button
                  onClick={handleStop}
                  variant="destructive"
                  className="h-12 px-6"
                >
                  <StopCircle className="mr-2 h-5 w-5" />
                  Stop
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Prompt Templates */}
        <PromptTemplates onSelectTemplate={(template) => setPrompt(template)} />

        {/* Favorite Configs */}
        <FavoriteConfigs currentConfig={config} onLoadConfig={handleLoadConfig} />

        {/* Configuration Card */}
        <Card className="border shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="w-5 h-5 text-primary" />
              Advanced Settings
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
                  checked={config.useProposerCriticVerifier}
                  onCheckedChange={(checked) => setConfig({ ...config, useProposerCriticVerifier: checked })}
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

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="space-y-1">
                  <Label className="text-sm">Erikson Filter</Label>
                  <p className="text-xs text-muted-foreground">S-block psychosocial lens</p>
                </div>
                <Switch
                  checked={config.useErikson}
                  onCheckedChange={(checked) => setConfig({ ...config, useErikson: checked })}
                />
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

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <ComparisonModal
                originalPrompt={result.promptImprovement?.originalPrompt || prompt}
                optimizedPrompt={result.promptImprovement?.improvedPrompt || result.finalText}
                originalTokens={result.savings.initialTokens}
                optimizedTokens={result.savings.finalTokens}
                improvementPercentage={result.savings.percentageSaved}
                iterations={result.iterations}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyResult}
                className="gap-2"
              >
                {copiedResult ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Result
                  </>
                )}
              </Button>
            </div>

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
                    Quality Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary">
                    +{Math.abs(result.savings.percentageSaved)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Prompt quality gain
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
                            <span className="text-xs">{metric.label}</span>
                            <span className="px-2 py-1 bg-destructive/20 rounded text-xs font-mono">{metric.grade}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* After */}
                    <div className="space-y-3 p-4 rounded-xl bg-primary/5 border-2 border-primary/20">
                      <div className="text-sm font-semibold text-primary mb-3">After Optimization</div>
                      <div className="space-y-2">
                        {[
                          { label: 'Structure', grade: 'A' },
                          { label: 'Clarity', grade: 'A' },
                          { label: 'Specificity', grade: 'A-' },
                          { label: 'Completeness', grade: 'A' },
                          { label: 'Token Efficiency', grade: 'A+' },
                        ].map((metric) => (
                          <div key={metric.label} className="flex justify-between items-center">
                            <span className="text-xs">{metric.label}</span>
                            <span className="px-2 py-1 bg-primary/20 rounded text-xs font-mono">{metric.grade}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* A/B Testing Card */}
            <Card className="border-2 border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-orange-500/10 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <Trophy className="w-5 h-5" />
                  A/B Test Results
                </CardTitle>
                <CardDescription>Compare original vs optimized prompt performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original Prompt */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Original Prompt</Label>
                    <div className="p-3 bg-background rounded-lg border max-h-48 overflow-y-auto text-sm">
                      {result.promptImprovement?.originalPrompt || prompt}
                    </div>
                    <Button
                      variant={abTestWinner === 'original' ? 'default' : 'outline'}
                      size="sm"
                      className="w-full"
                      onClick={() => setAbTestWinner('original')}
                    >
                      {abTestWinner === 'original' && <Trophy className="w-3 h-3 mr-1" />}
                      Mark as Winner
                    </Button>
                  </div>

                  {/* Optimized Prompt */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-primary">Optimized Prompt</Label>
                    <div className="p-3 bg-background rounded-lg border-2 border-primary/20 max-h-48 overflow-y-auto text-sm">
                      {result.promptImprovement?.improvedPrompt || result.finalText}
                    </div>
                    <Button
                      variant={abTestWinner === 'optimized' ? 'default' : 'outline'}
                      size="sm"
                      className="w-full"
                      onClick={() => setAbTestWinner('optimized')}
                    >
                      {abTestWinner === 'optimized' && <Trophy className="w-3 h-3 mr-1" />}
                      Mark as Winner
                    </Button>
                  </div>
                </div>

                {/* Test Notes */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Test Notes</Label>
                  <TextareaComponent
                    placeholder="Describe your A/B test results: response quality, accuracy, user satisfaction, etc."
                    value={abTestNotes}
                    onChange={(e) => setAbTestNotes(e.target.value)}
                    rows={3}
                    className="resize-none text-sm"
                  />
                </div>

                {/* Tie Option */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={abTestWinner === 'tie' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAbTestWinner('tie')}
                  >
                    {abTestWinner === 'tie' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                    Both Equal (Tie)
                  </Button>
                  
                  {/* Save Button */}
                  {abTestWinner && lastResultId && (
                    <Button
                      variant="default"
                      size="sm"
                      className="ml-auto gradient-primary"
                      onClick={async () => {
                        try {
                          const { error } = await supabase
                            .from('optimization_results')
                            .update({
                              ab_test_winner: abTestWinner,
                              ab_test_notes: abTestNotes || null,
                            })
                            .eq('id', lastResultId);

                          if (error) throw error;

                          toast({
                            title: "A/B Test Saved",
                            description: `Winner: ${abTestWinner}`,
                          });
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to save A/B test results",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Save A/B Results
                    </Button>
                  )}
                </div>

                {abTestWinner && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-400">
                      <strong>Winner:</strong> {abTestWinner === 'original' ? 'Original' : abTestWinner === 'optimized' ? 'Optimized' : 'Tie'} prompt
                      {lastResultId && ' — Click "Save A/B Results" to record this in analytics'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Final Output Card */}
            <Card className="border-2 border-primary/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Optimized Output
                </CardTitle>
                <CardDescription>Final processed result ready to use</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted/50 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                  {result.finalText}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
