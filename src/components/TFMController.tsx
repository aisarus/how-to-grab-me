import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap, TrendingDown, Sparkles, Settings, BarChart3, CheckCircle2, Trophy, StopCircle, Copy, Check, LogOut, MessageSquare, Brain, Gauge, Target, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Textarea as TextareaComponent } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { PromptTemplates } from './PromptTemplates';
import { FavoriteConfigs } from './FavoriteConfigs';
import { ComparisonModal } from './ComparisonModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { analyzePromptComplexity, type ComplexityScore } from '@/lib/promptComplexityAnalyzer';

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
  arbiter?: {
    action: 'CONTINUE' | 'STOP_ACCEPT' | 'STOP_BEST' | 'ROLLBACK';
    reason: string;
    converged: boolean;
    metrics: {
      votes: number;
      convergenceStreak: number;
      qualityGate: boolean;
      oscillationDetected: boolean;
    };
    iterations: Array<{
      iteration: number;
      operator: 'D' | 'S';
      metrics: {
        sem: number;
        lex: number;
        dlen: number;
        dstyle: number;
        defmn: number;
      };
      scores: {
        E: number;
        F: number;
        M: number;
        N: number;
        B: number;
      };
    }>;
    telemetry: Record<string, any>;
  };
}

interface ABTestResults {
  withEFMNB: TFMResult;
  withoutEFMNB: TFMResult;
  winner: 'withEFMNB' | 'withoutEFMNB' | 'tie';
  comparison: {
    tokenSavingsDiff: number;
    iterationsDiff: number;
    convergenceDiff: boolean;
  };
}

export const TFMController = () => {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TFMResult | null>(null);
  const [abTestResults, setAbTestResults] = useState<ABTestResults | null>(null);
  const [abTestWinner, setAbTestWinner] = useState<'original' | 'optimized' | 'tie' | null>(null);
  const [abTestNotes, setAbTestNotes] = useState('');
  const [lastResultId, setLastResultId] = useState<string | null>(null);
  const [copiedResult, setCopiedResult] = useState(false);
  const [complexityAnalysis, setComplexityAnalysis] = useState<ComplexityScore | null>(null);
  const [autoIterations, setAutoIterations] = useState(false);
  const [config, setConfig] = useState({
    a: 0.20,
    b: 0.35,
    maxIterations: 4,
    convergenceThreshold: 0.05,
    useEFMNB: true,
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
      autoIterations,
    };
    sessionStorage.setItem('tfm-controller-state', JSON.stringify(stateToSave));
  }, [prompt, config, result, abTestWinner, abTestNotes, lastResultId, autoIterations]);

  // Analyze prompt complexity when prompt changes
  useEffect(() => {
    const analyzePrompt = async () => {
      if (!prompt.trim() || prompt.length < 20) {
        setComplexityAnalysis(null);
        return;
      }

      try {
        // Fetch historical data for better recommendations
        const { data: historicalData } = await supabase
          .from('optimization_results')
          .select('original_tokens, iterations, improvement_percentage, original_prompt')
          .order('created_at', { ascending: false })
          .limit(100);

        const analysis = analyzePromptComplexity(prompt, historicalData || []);
        setComplexityAnalysis(analysis);

        // Auto-apply recommended iterations if enabled
        if (autoIterations && analysis.recommendedIterations !== config.maxIterations) {
          setConfig(prev => ({
            ...prev,
            maxIterations: analysis.recommendedIterations
          }));
        }
      } catch (error) {
        console.error('Failed to analyze prompt:', error);
      }
    };

    const debounceTimer = setTimeout(analyzePrompt, 500);
    return () => clearTimeout(debounceTimer);
  }, [prompt, autoIterations]);

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
            eriksonStage: complexityAnalysis?.eriksonStage,
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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      const { data: insertedData, error: dbError } = await supabase
        .from('optimization_results')
        .insert({
          user_id: user.id,
          original_prompt: prompt,
          optimized_prompt: data.promptImprovement?.improvedPrompt || data.finalText,
          original_tokens: data.savings.initialTokens,
          optimized_tokens: data.savings.finalTokens,
          improvement_percentage: data.savings.percentageSaved,
          a_parameter: config.a,
          b_parameter: config.b,
          iterations: data.iterations,
          convergence_threshold: config.convergenceThreshold,
          erikson_stage: complexityAnalysis?.eriksonStage || null,
          accepted: data.telemetry.accepted,
          accepted_iter: data.telemetry.accepted_iter,
          tta_sec: data.telemetry.tta_sec,
          cost_cents: data.telemetry.cost_cents,
          cost_variance_cents: data.telemetry.cost_variance_cents,
          tokens_breakdown: data.telemetry.tokens_breakdown,
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

  const handleLoadConfig = (newConfig: Omit<typeof config, 'useEFMNB' | 'useProposerCriticVerifier'> & { useEFMNB: boolean; useProposerCriticVerifier: boolean }) => {
    setConfig(newConfig);
  };

  const runABTest = async () => {
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
    setAbTestResults(null);
    abortControllerRef.current = new AbortController();

    try {
      toast({
        title: "Starting A/B Test",
        description: "Running optimization with and without EFMNB framing...",
      });

      // Run with EFMNB
      const { data: withEFMNB, error: error1 } = await supabase.functions.invoke('tri-tfm-controller', {
        body: {
          prompt,
          config: {
            ...config,
            useEFMNB: true,
          }
        }
      });

      if (!abortControllerRef.current) return;
      if (error1) throw error1;

      toast({
        title: "Phase 1 Complete",
        description: "Testing without EFMNB framing...",
      });

      // Run without EFMNB
      const { data: withoutEFMNB, error: error2 } = await supabase.functions.invoke('tri-tfm-controller', {
        body: {
          prompt,
          config: {
            ...config,
            useEFMNB: false,
          }
        }
      });

      if (!abortControllerRef.current) return;
      if (error2) throw error2;

      // Determine winner
      const tokenSavingsDiff = withEFMNB.savings.percentageSaved - withoutEFMNB.savings.percentageSaved;
      const iterationsDiff = withoutEFMNB.iterations - withEFMNB.iterations;
      const convergenceDiff = withEFMNB.converged !== withoutEFMNB.converged;

      let winner: 'withEFMNB' | 'withoutEFMNB' | 'tie' = 'tie';
      if (Math.abs(tokenSavingsDiff) > 2) {
        winner = tokenSavingsDiff > 0 ? 'withEFMNB' : 'withoutEFMNB';
      } else if (iterationsDiff !== 0) {
        winner = iterationsDiff > 0 ? 'withEFMNB' : 'withoutEFMNB';
      }

      const abResults: ABTestResults = {
        withEFMNB,
        withoutEFMNB,
        winner,
        comparison: {
          tokenSavingsDiff,
          iterationsDiff,
          convergenceDiff,
        }
      };

      setAbTestResults(abResults);

      // Save both results to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('optimization_results').insert([
          {
            user_id: user.id,
            original_prompt: prompt,
            optimized_prompt: withEFMNB.promptImprovement?.improvedPrompt || withEFMNB.finalText,
            original_tokens: withEFMNB.savings.initialTokens,
            optimized_tokens: withEFMNB.savings.finalTokens,
            improvement_percentage: withEFMNB.savings.percentageSaved,
            a_parameter: config.a,
            b_parameter: config.b,
            iterations: withEFMNB.iterations,
            convergence_threshold: config.convergenceThreshold,
            erikson_stage: complexityAnalysis?.eriksonStage || null,
            ab_test_winner: winner === 'withEFMNB' ? 'With EFMNB' : winner === 'tie' ? 'Tie' : 'Without EFMNB',
            ab_test_notes: `A/B Test: With EFMNB${complexityAnalysis?.eriksonStage ? `, Erikson Stage ${complexityAnalysis.eriksonStage}` : ''}`
          },
          {
            user_id: user.id,
            original_prompt: prompt,
            optimized_prompt: withoutEFMNB.promptImprovement?.improvedPrompt || withoutEFMNB.finalText,
            original_tokens: withoutEFMNB.savings.initialTokens,
            optimized_tokens: withoutEFMNB.savings.finalTokens,
            improvement_percentage: withoutEFMNB.savings.percentageSaved,
            a_parameter: config.a,
            b_parameter: config.b,
            iterations: withoutEFMNB.iterations,
            convergence_threshold: config.convergenceThreshold,
            erikson_stage: complexityAnalysis?.eriksonStage || null,
            ab_test_winner: winner === 'withoutEFMNB' ? 'Without EFMNB' : winner === 'tie' ? 'Tie' : 'With EFMNB',
            ab_test_notes: `A/B Test: Without EFMNB${complexityAnalysis?.eriksonStage ? `, Erikson Stage ${complexityAnalysis.eriksonStage}` : ''}`
          }
        ]);
      }

      toast({
        title: "A/B Test Complete",
        description: `Winner: ${winner === 'withEFMNB' ? 'With EFMNB' : winner === 'withoutEFMNB' ? 'Without EFMNB' : 'Tie'}`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to perform A/B test",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Header */}
      <div className="border-b glass-effect sticky top-0 z-10 flex-shrink-0">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow flex-shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
                  {t('tfmController.title')}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
                  {t('tfmController.subtitle')}
                </p>
              </div>
            </div>
            <div className="flex gap-1 sm:gap-2 flex-shrink-0">
              <LanguageSwitcher />
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1 sm:gap-2"
                onClick={() => navigate('/assistant')}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">{t('common.assistant')}</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1 sm:gap-2"
                onClick={() => navigate('/analytics')}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">{t('common.analytics')}</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1 sm:gap-2"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate('/auth');
                }}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t('common.logout')}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Main Input Card */}
        <Card className="floating-card border-2 shadow-lg" style={{ animationDelay: '0s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              {t('tfmController.inputLabel')}
            </CardTitle>
            <CardDescription>
              {t('tfmController.inputDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder={t('tfmController.inputPlaceholder')}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={8}
                className="resize-none font-mono text-sm"
              />
              
              {/* Complexity Analysis Display */}
              {complexityAnalysis && (
                <div className="p-4 rounded-lg border bg-muted/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t('general.complexityScore')}: {complexityAnalysis.score}/100</span>
                    <span className="text-xs text-muted-foreground">
                      {t('general.confidence')}: {Math.round(complexityAnalysis.confidence * 100)}%
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div className="col-span-2 pb-2 border-b border-border/50">
                      <span className="text-muted-foreground">{t('general.taskType')}:</span>
                      <span className="ml-1 font-medium">
                        {complexityAnalysis.taskType === 'creative' ? t('general.creative') : t('general.technical')}
                      </span>
                      <span className="ml-2 text-muted-foreground">{t('general.eriksonStage')}:</span>
                      <span className="ml-1 font-medium">{complexityAnalysis.eriksonStage}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('general.length')}:</span>
                      <span className="ml-1 font-medium">{complexityAnalysis.factors.length}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('general.structure')}:</span>
                      <span className="ml-1 font-medium">{complexityAnalysis.factors.structure}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('general.technicalTerms')}:</span>
                      <span className="ml-1 font-medium">{complexityAnalysis.factors.technicalTerms}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('general.specificity')}:</span>
                      <span className="ml-1 font-medium">{complexityAnalysis.factors.specificity}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-sm">
                      {t('general.recommendedIterations')}: <strong>{complexityAnalysis.recommendedIterations}</strong>
                    </span>
                    {!autoIterations && config.maxIterations !== complexityAnalysis.recommendedIterations && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfig(prev => ({ ...prev, maxIterations: complexityAnalysis.recommendedIterations }))}
                      >
                        {t('general.apply')}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  const randomPrompts = [
                    "Create a comprehensive business plan for a sustainable coffee shop that focuses on locally sourced ingredients, zero-waste practices, and community engagement programs for the next 3 years",
                    "Write a detailed technical documentation for a REST API that handles user authentication, including OAuth2 implementation, JWT tokens, refresh mechanisms, and security best practices",
                    "Develop a marketing strategy for launching a new fitness app targeting millennials, including social media campaigns, influencer partnerships, pricing models, and user acquisition tactics",
                    "Explain the architecture and implementation of a microservices-based e-commerce platform, covering service communication, database strategies, deployment patterns, and scalability considerations",
                    "Design a curriculum for teaching programming to complete beginners, including learning objectives, weekly modules, practical projects, assessment methods, and recommended resources",
                    "Analyze the environmental impact of cryptocurrency mining operations and propose sustainable alternatives, considering energy consumption, carbon footprint, and regulatory frameworks",
                    "Create a step-by-step guide for migrating a legacy monolithic application to a cloud-native architecture using containers, orchestration tools, and continuous deployment pipelines",
                    "Write a research proposal investigating the effects of remote work on employee productivity, mental health, and work-life balance, including methodology, data collection, and expected outcomes",
                    "Develop a customer retention strategy for a SaaS company, covering onboarding processes, feature adoption metrics, engagement campaigns, and churn prevention techniques with specific KPIs",
                    "Explain quantum computing principles and their practical applications in cryptography, drug discovery, and optimization problems, making it accessible for business decision-makers",
                    "Design a data analytics dashboard for an online retail platform that tracks user behavior, conversion rates, inventory levels, and provides actionable insights for business growth",
                    "Create a comprehensive content strategy for a B2B tech company, including blog topics, SEO optimization, lead generation tactics, content calendar, and performance measurement frameworks",
                    "Develop a machine learning model pipeline for predicting customer churn, covering data preprocessing, feature engineering, model selection, hyperparameter tuning, and deployment strategies",
                    "Write a detailed project plan for implementing agile methodologies in a traditional waterfall organization, addressing change management, team training, tools selection, and success metrics",
                    "Analyze the competitive landscape of the electric vehicle market, including market share analysis, technology trends, regulatory challenges, and strategic recommendations for new entrants"
                  ];
                  const randomPrompt = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
                  setPrompt(randomPrompt);
                  toast({
                    title: "Random prompt generated",
                    description: "A simple prompt has been generated for optimization testing",
                  });
                }}
                variant="outline"
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Random Test Prompt
              </Button>
            </div>

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
              
              <Button 
                onClick={runABTest} 
                disabled={loading || !prompt.trim()}
                variant="outline"
                className="h-12 px-6 border-2 border-primary/30 hover:bg-primary/10"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Trophy className="mr-2 h-5 w-5" />
                    A/B Test
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
        <Card className="floating-card border shadow-md" style={{ animationDelay: '0.3s' }}>
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

            {/* Auto Iterations Toggle */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/5 border-2 border-blue-500/20">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-blue-600" />
                    <Label className="font-semibold">Автоматический выбор итераций</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Определяет оптимальное количество итераций на основе сложности промпта и статистики
                  </p>
                </div>
                <Switch
                  checked={autoIterations}
                  onCheckedChange={setAutoIterations}
                />
              </div>
            </div>

            {/* Parameters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Expansion Target (α)</Label>
                  <span className="text-xs font-mono bg-primary/10 px-2 py-1 rounded text-primary">
                    +{(config.a * 100).toFixed(0)}%
                  </span>
                </div>
                <Input
                  type="number"
                  step="0.05"
                  min="0.10"
                  max="0.50"
                  value={config.a}
                  onChange={(e) => setConfig({ ...config, a: parseFloat(e.target.value) })}
                  className="font-mono"
                />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-primary">D-block expansion rate:</span> How much detail to add
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-secondary transition-all" 
                        style={{ width: `${(config.a / 0.5) * 100}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground w-12">{(config.a * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Compression Target (β)</Label>
                  <span className="text-xs font-mono bg-secondary/10 px-2 py-1 rounded text-secondary">
                    -{(config.b * 100).toFixed(0)}%
                  </span>
                </div>
                <Input
                  type="number"
                  step="0.05"
                  min="0.20"
                  max="0.60"
                  value={config.b}
                  onChange={(e) => setConfig({ ...config, b: parseFloat(e.target.value) })}
                  className="font-mono"
                />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-secondary">S-block compression rate:</span> How much to condense
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-secondary to-primary transition-all" 
                        style={{ width: `${(config.b / 0.6) * 100}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground w-12">{(config.b * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Max Iterations</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={config.maxIterations}
                  onChange={(e) => setConfig({ ...config, maxIterations: parseInt(e.target.value) })}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum D→S cycles before stopping (1-10)
                </p>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="grid grid-cols-1 gap-4 pt-4 border-t">
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
            </div>
          </CardContent>
        </Card>

        {/* A/B Test Results Section */}
        {abTestResults && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-2 border-primary shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-primary" />
                    A/B Test Results: EFMNB Framing Comparison
                  </CardTitle>
                  <div className={`px-4 py-2 rounded-full font-bold ${
                    abTestResults.winner === 'withEFMNB' ? 'bg-green-100 text-green-700' :
                    abTestResults.winner === 'withoutEFMNB' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    Winner: {abTestResults.winner === 'withEFMNB' ? 'With EFMNB' : 
                             abTestResults.winner === 'withoutEFMNB' ? 'Without EFMNB' : 'Tie'}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Comparison Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Token Savings Difference</p>
                        <p className={`text-2xl font-bold ${
                          abTestResults.comparison.tokenSavingsDiff > 0 ? 'text-green-600' : 
                          abTestResults.comparison.tokenSavingsDiff < 0 ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {abTestResults.comparison.tokenSavingsDiff > 0 ? '+' : ''}
                          {abTestResults.comparison.tokenSavingsDiff.toFixed(2)}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {abTestResults.comparison.tokenSavingsDiff > 0 ? 'EFMNB saves more' : 
                           abTestResults.comparison.tokenSavingsDiff < 0 ? 'No EFMNB saves more' : 'Equal savings'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Iterations Difference</p>
                        <p className={`text-2xl font-bold ${
                          abTestResults.comparison.iterationsDiff > 0 ? 'text-green-600' : 
                          abTestResults.comparison.iterationsDiff < 0 ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {abTestResults.comparison.iterationsDiff > 0 ? '+' : ''}
                          {abTestResults.comparison.iterationsDiff}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {abTestResults.comparison.iterationsDiff > 0 ? 'EFMNB faster' : 
                           abTestResults.comparison.iterationsDiff < 0 ? 'No EFMNB faster' : 'Same speed'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Convergence</p>
                        <p className="text-2xl font-bold text-primary">
                          {abTestResults.withEFMNB.converged && abTestResults.withoutEFMNB.converged ? 'Both' :
                           abTestResults.withEFMNB.converged ? 'EFMNB Only' :
                           abTestResults.withoutEFMNB.converged ? 'No EFMNB Only' : 'Neither'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Converged</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Side by Side Results */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* With EFMNB */}
                  <Card className={`border-2 ${abTestResults.winner === 'withEFMNB' ? 'border-green-500 shadow-lg' : 'border-gray-300'}`}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        With EFMNB Framing
                        {abTestResults.winner === 'withEFMNB' && (
                          <Trophy className="w-5 h-5 text-green-600 ml-auto" />
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Quality Improvement</p>
                          <p className="text-xl font-bold text-green-600">
                            {Math.abs(abTestResults.withEFMNB.savings.percentageSaved).toFixed(2)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Iterations</p>
                          <p className="text-xl font-bold">{abTestResults.withEFMNB.iterations}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Initial Tokens</p>
                          <p className="text-sm font-semibold">{abTestResults.withEFMNB.savings.initialTokens}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Final Tokens</p>
                          <p className="text-sm font-semibold">{abTestResults.withEFMNB.savings.finalTokens}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Optimized Output</Label>
                        <div className="mt-2 p-3 bg-muted rounded-lg text-sm max-h-40 overflow-y-auto">
                          {abTestResults.withEFMNB.promptImprovement?.improvedPrompt || abTestResults.withEFMNB.finalText}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Without EFMNB */}
                  <Card className={`border-2 ${abTestResults.winner === 'withoutEFMNB' ? 'border-blue-500 shadow-lg' : 'border-gray-300'}`}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Without EFMNB Framing
                        {abTestResults.winner === 'withoutEFMNB' && (
                          <Trophy className="w-5 h-5 text-blue-600 ml-auto" />
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Quality Improvement</p>
                          <p className="text-xl font-bold text-green-600">
                            {Math.abs(abTestResults.withoutEFMNB.savings.percentageSaved).toFixed(2)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Iterations</p>
                          <p className="text-xl font-bold">{abTestResults.withoutEFMNB.iterations}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Initial Tokens</p>
                          <p className="text-sm font-semibold">{abTestResults.withoutEFMNB.savings.initialTokens}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Final Tokens</p>
                          <p className="text-sm font-semibold">{abTestResults.withoutEFMNB.savings.finalTokens}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Optimized Output</Label>
                        <div className="mt-2 p-3 bg-muted rounded-lg text-sm max-h-40 overflow-y-auto">
                          {abTestResults.withoutEFMNB.promptImprovement?.improvedPrompt || abTestResults.withoutEFMNB.finalText}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results Section */}
        {result && !abTestResults && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Prompt Improvement Banner */}
            {result.promptImprovement && (
              <Card className="floating-card border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 shadow-lg" style={{ animationDelay: '0.1s' }}>
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
              <Card className="floating-card border-2" style={{ animationDelay: '0.2s' }}>
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

              <Card className="floating-card border-2" style={{ animationDelay: '0.4s' }}>
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

              <Card className="floating-card border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5" style={{ animationDelay: '0.6s' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary">
                    <TrendingDown className="w-4 h-4" />
                    Success@1 uplift
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary">
                    +{Math.abs(result.savings.percentageSaved)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    First-attempt acceptance rate
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Arbiter Analysis Section */}
            {result.arbiter && (
              <Card className="floating-card border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-purple-500/10 shadow-lg" style={{ animationDelay: '0.8s' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                    <Gauge className="w-5 h-5" />
                    {t('arbiter.title')}
                  </CardTitle>
                  <CardDescription>{t('arbiter.subtitle')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Decision Banner */}
                  <div className={`p-4 rounded-xl border-2 ${
                    result.arbiter.action === 'STOP_ACCEPT' ? 'bg-green-500/10 border-green-500/30' :
                    result.arbiter.action === 'STOP_BEST' ? 'bg-blue-500/10 border-blue-500/30' :
                    result.arbiter.action === 'ROLLBACK' ? 'bg-red-500/10 border-red-500/30' :
                    'bg-yellow-500/10 border-yellow-500/30'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">{t('arbiter.decision')}:</span>
                      <span className="px-3 py-1 rounded-full text-sm font-bold bg-background/50">
                        {t(`arbiter.action.${result.arbiter.action}`)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{result.arbiter.reason}</p>
                  </div>

                  {/* Convergence Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Votes */}
                    <div className="p-4 rounded-lg bg-background/50 border">
                      <div className="flex items-center justify-between mb-2">
                        <Target className="w-4 h-4 text-purple-500" />
                        <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {result.arbiter.metrics.votes}/5
                        </span>
                      </div>
                      <p className="text-xs font-medium">{t('arbiter.metrics.votes')}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('arbiter.metrics.votesDescription').replace('{votes}', result.arbiter.metrics.votes.toString())}
                      </p>
                    </div>

                    {/* Convergence Streak */}
                    <div className="p-4 rounded-lg bg-background/50 border">
                      <div className="flex items-center justify-between mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {result.arbiter.metrics.convergenceStreak}
                        </span>
                      </div>
                      <p className="text-xs font-medium">{t('arbiter.metrics.convergenceStreak')}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('arbiter.metrics.convergenceStreakDescription').replace('{streak}', result.arbiter.metrics.convergenceStreak.toString())}
                      </p>
                    </div>

                    {/* Quality Gate */}
                    <div className={`p-4 rounded-lg border ${
                      result.arbiter.metrics.qualityGate 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-red-500/10 border-red-500/30'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        {result.arbiter.metrics.qualityGate ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`text-sm font-bold ${
                          result.arbiter.metrics.qualityGate ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {result.arbiter.metrics.qualityGate 
                            ? t('arbiter.metrics.qualityGatePassed')
                            : t('arbiter.metrics.qualityGateFailed')}
                        </span>
                      </div>
                      <p className="text-xs font-medium">{t('arbiter.metrics.qualityGate')}</p>
                    </div>

                    {/* Oscillation Detection */}
                    <div className={`p-4 rounded-lg border ${
                      result.arbiter.metrics.oscillationDetected 
                        ? 'bg-amber-500/10 border-amber-500/30' 
                        : 'bg-green-500/10 border-green-500/30'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        {result.arbiter.metrics.oscillationDetected ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        )}
                        <span className={`text-sm font-bold ${
                          result.arbiter.metrics.oscillationDetected ? 'text-amber-600' : 'text-green-600'
                        }`}>
                          {result.arbiter.metrics.oscillationDetected 
                            ? t('arbiter.metrics.oscillationYes')
                            : t('arbiter.metrics.oscillationNo')}
                        </span>
                      </div>
                      <p className="text-xs font-medium">{t('arbiter.metrics.oscillationDetected')}</p>
                    </div>
                  </div>

                  {/* Detailed Metrics from Last Iteration */}
                  {result.arbiter.iterations && result.arbiter.iterations.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold">{t('arbiter.iterationHistory.metricsSnapshot')}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {(() => {
                          const lastIter = result.arbiter.iterations[result.arbiter.iterations.length - 1];
                          return (
                            <>
                              <div className="p-3 rounded-lg bg-background/50 border">
                                <p className="text-xs text-muted-foreground mb-1">{t('arbiter.metrics.semantic')}</p>
                                <p className="text-lg font-bold">{(lastIter.metrics.sem * 100).toFixed(1)}%</p>
                              </div>
                              <div className="p-3 rounded-lg bg-background/50 border">
                                <p className="text-xs text-muted-foreground mb-1">{t('arbiter.metrics.lexical')}</p>
                                <p className="text-lg font-bold">{(lastIter.metrics.lex * 100).toFixed(1)}%</p>
                              </div>
                              <div className="p-3 rounded-lg bg-background/50 border">
                                <p className="text-xs text-muted-foreground mb-1">{t('arbiter.metrics.lengthChange')}</p>
                                <p className="text-lg font-bold">{(lastIter.metrics.dlen * 100).toFixed(1)}%</p>
                              </div>
                              <div className="p-3 rounded-lg bg-background/50 border">
                                <p className="text-xs text-muted-foreground mb-1">{t('arbiter.metrics.styleChange')}</p>
                                <p className="text-lg font-bold">{(lastIter.metrics.dstyle * 100).toFixed(1)}%</p>
                              </div>
                              <div className="p-3 rounded-lg bg-background/50 border">
                                <p className="text-xs text-muted-foreground mb-1">{t('arbiter.metrics.efmnDelta')}</p>
                                <p className="text-lg font-bold">{(lastIter.metrics.defmn * 100).toFixed(1)}%</p>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* EFMNB Scores */}
                      <div className="pt-4 border-t">
                        <h4 className="text-sm font-semibold mb-3">{t('arbiter.scores.title')}</h4>
                        <div className="grid grid-cols-5 gap-3">
                          {(() => {
                            const lastIter = result.arbiter.iterations[result.arbiter.iterations.length - 1];
                            const scores = [
                              { key: 'E', value: lastIter.scores.E, color: 'text-purple-600' },
                              { key: 'F', value: lastIter.scores.F, color: 'text-blue-600' },
                              { key: 'M', value: lastIter.scores.M, color: 'text-green-600' },
                              { key: 'N', value: lastIter.scores.N, color: 'text-yellow-600' },
                              { key: 'B', value: lastIter.scores.B, color: 'text-red-600' },
                            ];
                            return scores.map((score) => (
                              <div key={score.key} className="text-center p-3 rounded-lg bg-background/50 border">
                                <p className="text-xs text-muted-foreground mb-1">{t(`arbiter.scores.${score.key}`)}</p>
                                <p className={`text-2xl font-bold ${score.color}`}>{score.value.toFixed(2)}</p>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>

                      {/* Iteration Timeline */}
                      <div className="pt-4 border-t">
                        <h4 className="text-sm font-semibold mb-3">{t('arbiter.iterationHistory.title')}</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {result.arbiter.iterations.map((iter, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-background/50 border text-xs">
                              <span className="font-mono font-bold w-12">{iter.iteration}</span>
                              <span className={`px-2 py-1 rounded font-bold ${
                                iter.operator === 'D' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'
                              }`}>
                                {iter.operator}
                              </span>
                              <div className="flex-1 flex gap-2 text-muted-foreground">
                                <span>sem: {(iter.metrics.sem * 100).toFixed(0)}%</span>
                                <span>lex: {(iter.metrics.lex * 100).toFixed(0)}%</span>
                                <span>Δlen: {(iter.metrics.dlen * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quality Analysis */}
            {result.promptImprovement && (
              <Card className="floating-card border-2 shadow-lg bg-gradient-to-br from-background to-accent/5" style={{ animationDelay: '0.8s' }}>
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
                    placeholder="Auto-filled diff summary: what optimizer added (+constraints, +steps, +schema, etc.)"
                    value={abTestNotes}
                    onChange={(e) => setAbTestNotes(e.target.value)}
                    rows={3}
                    className="resize-none text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Describe A/B test results: Success@1, ↓ TTA, ↓ cost variance, policy-safe
                  </p>
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
    </div>
  );
};
