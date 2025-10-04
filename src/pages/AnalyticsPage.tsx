import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, TrendingUp, Target, Award, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OptimizationResult {
  id: string;
  created_at: string;
  original_prompt: string;
  optimized_prompt: string;
  original_tokens: number;
  optimized_tokens: number;
  improvement_percentage: number;
  a_parameter: number;
  b_parameter: number;
  iterations: number;
  ab_test_winner: string | null;
  ab_test_notes: string | null;
}

export default function AnalyticsPage() {
  const [results, setResults] = useState<OptimizationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const { data, error } = await supabase
        .from('optimization_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error loading results:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные аналитики",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (results.length === 0) return {
      avgImprovement: 0,
      totalOptimizations: 0,
      totalTokensSaved: 0,
      bestImprovement: 0,
    };

    const avgImprovement = results.reduce((sum, r) => sum + r.improvement_percentage, 0) / results.length;
    const totalTokensSaved = results.reduce((sum, r) => sum + (r.original_tokens - r.optimized_tokens), 0);
    const bestImprovement = Math.max(...results.map(r => r.improvement_percentage));

    return {
      avgImprovement: avgImprovement.toFixed(1),
      totalOptimizations: results.length,
      totalTokensSaved,
      bestImprovement: bestImprovement.toFixed(1),
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Назад
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Analytics Dashboard
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Метрики эффективности TRI/TFM технологии
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4" />
                Средняя эффективность
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.avgImprovement}%</div>
              <p className="text-xs text-muted-foreground mt-1">По всем оптимизациям</p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Всего оптимизаций
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalOptimizations}</div>
              <p className="text-xs text-muted-foreground mt-1">За все время</p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Токенов сэкономлено
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.totalTokensSaved.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Суммарно</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                <Award className="w-4 h-4" />
                Лучший результат
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.bestImprovement}%</div>
              <p className="text-xs text-muted-foreground mt-1">Максимальная оптимизация</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Optimizations */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              История оптимизаций
            </CardTitle>
            <CardDescription>Последние результаты работы TRI/TFM</CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Пока нет данных для анализа</p>
                <p className="text-sm mt-2">Выполните оптимизацию промпта, чтобы увидеть статистику</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.slice(0, 10).map((result) => (
                  <div
                    key={result.id}
                    className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-primary">
                            {result.improvement_percentage}%
                          </span>
                          <div className="text-sm text-muted-foreground">
                            {result.original_tokens} → {result.optimized_tokens} токенов
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {result.iterations} итераций
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(result.created_at).toLocaleString('ru-RU')}
                        </div>
                        <details className="text-sm">
                          <summary className="cursor-pointer text-primary hover:underline">
                            Показать промпты
                          </summary>
                          <div className="mt-2 space-y-2">
                            <div className="p-2 bg-muted/50 rounded text-xs">
                              <div className="font-semibold mb-1">Оригинал:</div>
                              <div className="line-clamp-2">{result.original_prompt}</div>
                            </div>
                            <div className="p-2 bg-primary/5 rounded text-xs">
                              <div className="font-semibold mb-1">Оптимизированный:</div>
                              <div className="line-clamp-2">{result.optimized_prompt}</div>
                            </div>
                          </div>
                        </details>
                      </div>
                      {result.ab_test_winner && (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-semibold">
                          <Award className="w-3 h-3" />
                          A/B: {result.ab_test_winner}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Value Proposition */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Award className="w-5 h-5" />
              Ценность для бизнеса
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-background/50 rounded-lg border">
                <div className="text-2xl font-bold mb-2">${(stats.totalTokensSaved * 0.00002).toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">
                  Экономия на API вызовах (GPT-4 pricing)
                </div>
              </div>
              <div className="p-4 bg-background/50 rounded-lg border">
                <div className="text-2xl font-bold mb-2">{(stats.totalTokensSaved / 1000).toFixed(1)}K</div>
                <div className="text-sm text-muted-foreground">
                  Токенов сэкономлено = меньше нагрузки на инфраструктуру
                </div>
              </div>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm">
                <strong className="text-primary">Для VK/Яндекс:</strong> При масштабе в миллионы запросов в день,
                даже {stats.avgImprovement}% оптимизация может сэкономить сотни тысяч долларов на инфраструктуре
                и улучшить пользовательский опыт за счет более быстрых ответов.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
