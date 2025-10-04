import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, TrendingDown, Zap } from 'lucide-react';
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
      console.log('Calling TRI/TFM controller...');
      const { data, error } = await supabase.functions.invoke('tri-tfm-controller', {
        body: { prompt, config },
      });

      if (error) throw error;

      console.log('TFM Result:', data);
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
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-6 h-6" />
            TRI/TFM Controller
          </CardTitle>
          <CardDescription>
            Optimize LLM response length through iterative D→S controller
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="prompt">Original Text</Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPrompt("Create a comprehensive marketing strategy for a new eco-friendly product line. Include target audience analysis, competitive positioning, pricing strategy, distribution channels, promotional tactics, and success metrics. Make sure to address sustainability messaging and how to communicate our environmental impact effectively.")}
                  >
                    Test Example 1
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPrompt("Explain quantum computing to a general audience. Cover what quantum computers are, how they differ from classical computers, what problems they can solve, current limitations, and future potential applications.")}
                  >
                    Test Example 2
                  </Button>
                </div>
              </div>
              <Textarea
                id="prompt"
                placeholder="Enter text to optimize..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                className="mt-2"
              />
            </div>

            {/* Configuration */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="a">Parameter a (D expansion)</Label>
                  <Input
                    id="a"
                    type="number"
                    step="0.01"
                    value={config.a}
                    onChange={(e) => setConfig({ ...config, a: parseFloat(e.target.value) })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="b">Parameter b (S reduction)</Label>
                  <Input
                    id="b"
                    type="number"
                    step="0.01"
                    value={config.b}
                    onChange={(e) => setConfig({ ...config, b: parseFloat(e.target.value) })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="maxIterations">Max Iterations</Label>
                  <Input
                    id="maxIterations"
                    type="number"
                    min="1"
                    max="10"
                    value={config.maxIterations}
                    onChange={(e) => setConfig({ ...config, maxIterations: parseInt(e.target.value) })}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* EFMNB, Proposer and Erikson Settings */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between space-x-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="autoImprove" className="font-semibold">Auto-Improve Prompt (Proposer-Critic-Verifier)</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically optimizes your prompt before processing — saves iterations and improves results
                    </p>
                  </div>
                  <Switch
                    id="autoImprove"
                    checked={config.autoImprovePrompt}
                    onCheckedChange={(checked) => setConfig({ ...config, autoImprovePrompt: checked })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-1">
                      <Label htmlFor="efmnb">EFMNB Framing (D block)</Label>
                      <p className="text-xs text-muted-foreground">
                        Evaluation→Evaluation→Comparison→Conclusion
                      </p>
                    </div>
                    <Switch
                      id="efmnb"
                      checked={config.useEFMNB}
                      onCheckedChange={(checked) => setConfig({ ...config, useEFMNB: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="erikson">Erikson Filter (S block)</Label>
                    <Select
                      value={config.eriksonStage.toString()}
                      onValueChange={(value) => setConfig({ ...config, eriksonStage: parseInt(value) })}
                    >
                      <SelectTrigger id="erikson">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No Filter</SelectItem>
                        <SelectItem value="1">1. Trust vs Mistrust (Hope)</SelectItem>
                        <SelectItem value="2">2. Autonomy vs Shame (Will)</SelectItem>
                        <SelectItem value="3">3. Initiative vs Guilt (Purpose)</SelectItem>
                        <SelectItem value="4">4. Industry vs Inferiority (Competence)</SelectItem>
                        <SelectItem value="5">5. Identity vs Role Confusion (Fidelity)</SelectItem>
                        <SelectItem value="6">6. Intimacy vs Isolation (Love)</SelectItem>
                        <SelectItem value="7">7. Generativity vs Stagnation (Care)</SelectItem>
                        <SelectItem value="8">8. Integrity vs Despair (Wisdom)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Psychosocial lens for reduction
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={loading || !prompt.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Run TFM
                </>
              )}
            </Button>
          </div>

          {/* Results Section */}
          {result && (
            <div className="space-y-4 pt-4 border-t">
              {/* Prompt Improvement Section */}
              {result.promptImprovement && (
                <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h3 className="font-semibold text-green-900 dark:text-green-100">
                      Proposer-Critic-Verifier: Prompt Optimized
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Original Prompt</Label>
                      <div className="mt-1 p-2 bg-background/50 rounded text-sm max-h-32 overflow-y-auto">
                        {result.promptImprovement.originalPrompt}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Improved Prompt</Label>
                      <div className="mt-1 p-2 bg-background/50 rounded text-sm max-h-32 overflow-y-auto">
                        {result.promptImprovement.improvedPrompt}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Applied Improvements</Label>
                    <ul className="mt-1 space-y-1">
                      {result.promptImprovement.improvements.map((imp, i) => (
                        <li key={i} className="text-xs flex items-start gap-2">
                          <span className="text-green-600 dark:text-green-400">✓</span>
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Iterations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{result.iterations}</div>
                    <p className="text-xs text-muted-foreground">
                      {result.converged ? '✓ Converged' : '⚠ Not converged'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Tokens</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {result.savings.initialTokens} → {result.savings.finalTokens}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Initial → Final
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 dark:bg-green-950">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingDown className="w-4 h-4" />
                      Token Efficiency
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {result.savings.reductionPercent}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      vs. baseline
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Token History */}
              <div>
                <Label>Token History by Iteration</Label>
                <div className="flex gap-2 mt-2">
                  {result.tokenHistory.map((tokens, i) => (
                    <div key={i} className="flex-1">
                      <div className="h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded" 
                           style={{ width: `${(tokens / result.tokenHistory[0]) * 100}%` }} />
                      <div className="text-xs text-center mt-1">{tokens}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Text */}
              <div>
                <Label htmlFor="result">Optimized Text</Label>
                <Textarea
                  id="result"
                  value={result.finalText}
                  rows={8}
                  readOnly
                  className="mt-2 font-mono text-sm"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Theory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>TRI/TFM</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>D (Developer):</strong> Expansion block — adds structure and details
            </p>
            <p>
              <strong>S (Stabilizer):</strong> Stabilization block — reduces redundancy
            </p>
            <p>
              <strong>Convergence criterion:</strong> |x_k - x_(k-1)| / x_k {'<'} δ
            </p>
            <p>
              L* = ((1-b)·I + R) / (1 - (1-b)(1+a))
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>EFMNB</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Emotional-Factual Matrix Next Build</strong>
            </p>
            <p>
              1. <strong>Evaluation:</strong> Element identification
            </p>
            <p>
              2. <strong>Evaluation:</strong> Context assessment
            </p>
            <p>
              3. <strong>Comparison:</strong> Aspect comparison
            </p>
            <p>
              4. <strong>Conclusion:</strong> Narrative synthesis
            </p>
            <p className="pt-2 border-t">
              Structured framing for deterministic reasoning control
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Erikson (8 Stages)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs text-muted-foreground">
            <p>1. Trust vs Mistrust → Hope</p>
            <p>2. Autonomy vs Shame → Will</p>
            <p>3. Initiative vs Guilt → Purpose</p>
            <p>4. Industry vs Inferiority → Competence</p>
            <p>5. Identity vs Role Confusion → Fidelity</p>
            <p>6. Intimacy vs Isolation → Love</p>
            <p>7. Generativity vs Stagnation → Care</p>
            <p>8. Integrity vs Despair → Wisdom</p>
            <p className="pt-2 border-t">
              Psychosocial filters for mature text reduction through developmental lens
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
