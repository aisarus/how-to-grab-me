import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, TrendingDown, Zap } from 'lucide-react';

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
}

export const TFMController = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TFMResult | null>(null);
  const [config, setConfig] = useState({
    a: 0.20,
    b: 0.35,
    maxIterations: 4,
  });
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите текст для оптимизации",
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
        title: "Оптимизация завершена",
        description: `Сокращение: ${data.savings.reductionPercent}% за ${data.iterations} итераций`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось выполнить оптимизацию",
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
            Оптимизация длины ответов LLM через итеративный контроллер D→S
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="prompt">Исходный текст</Label>
              <Textarea
                id="prompt"
                placeholder="Введите текст для оптимизации..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                className="mt-2"
              />
            </div>

            {/* Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="a">Параметр a (D расширение)</Label>
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
                <Label htmlFor="b">Параметр b (S сокращение)</Label>
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
                <Label htmlFor="maxIterations">Макс. итераций</Label>
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

            <Button 
              onClick={handleSubmit} 
              disabled={loading || !prompt.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Оптимизация...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Запустить TFM
                </>
              )}
            </Button>
          </div>

          {/* Results Section */}
          {result && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Итераций</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{result.iterations}</div>
                    <p className="text-xs text-muted-foreground">
                      {result.converged ? '✓ Сошлось' : '⚠ Не сошлось'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Токены</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {result.savings.initialTokens} → {result.savings.finalTokens}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Изначально → Итого
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 dark:bg-green-950">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingDown className="w-4 h-4" />
                      Экономия
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {result.savings.reductionPercent}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Сокращение токенов
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Token History */}
              <div>
                <Label>История токенов по итерациям</Label>
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
                <Label htmlFor="result">Оптимизированный текст</Label>
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

      {/* Theory Card */}
      <Card>
        <CardHeader>
          <CardTitle>О TRI/TFM</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>D (Developer):</strong> Блок расширения — добавляет структуру и детали
          </p>
          <p>
            <strong>S (Stabilizer):</strong> Блок стабилизации — сокращает избыточное
          </p>
          <p>
            <strong>Критерий сходимости:</strong> |x_k - x_(k-1)| / x_k {'<'} δ
          </p>
          <p>
            Формула фиксированной точки: L* = ((1-b)·I + R) / (1 - (1-b)(1+a))
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
