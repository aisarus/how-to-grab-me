import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, TrendingUp, Target, Award, ArrowLeft, Loader2, Trophy, Filter, Search, Download, Calendar, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AnalyticsCharts } from '@/components/AnalyticsCharts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { UserMenu } from '@/components/UserMenu';
import { PromptCarouselModal } from '@/components/PromptCarouselModal';
import { ComparisonModal } from '@/components/ComparisonModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';

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
  erikson_stage: number | null;
  accepted: boolean | null;
  accepted_iter: number | null;
  tta_sec: number | null;
  cost_cents: number | null;
  cost_variance_cents: number | null;
  tokens_breakdown: {
    orig: number;
    refine: number;
    final: number;
  } | null;
  old_quality_score?: number | null;
  new_quality_score?: number | null;
  compression_percentage?: number | null;
  quality_gain_percentage?: number | null;
  quality_improvement_score?: number | null;
}

export default function AnalyticsPage() {
  const [results, setResults] = useState<OptimizationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { t } = useLanguage();

  const loadResults = async () => {
    try {
      let query = supabase
        .from('optimization_results')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply date filters
      if (dateFrom) {
        query = query.gte('created_at', dateFrom.toISOString());
      }
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      
      // Type cast the data to match our interface
      const typedData = (data || []).map(item => ({
        ...item,
        tokens_breakdown: item.tokens_breakdown as { orig: number; refine: number; final: number } | null,
      }));
      
      setResults(typedData);
    } catch (error) {
      console.error('Error loading results:', error);
      toast({
        title: t('common.error'),
        description: t('analytics.errorLoading'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, [dateFrom, dateTo]);

  const calculateStats = () => {
    // Filter results based on all filters
    let filteredResults = results;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredResults = filteredResults.filter(r => 
        r.original_prompt.toLowerCase().includes(query) ||
        r.optimized_prompt.toLowerCase().includes(query) ||
        r.ab_test_notes?.toLowerCase().includes(query)
      );
    }

    if (filteredResults.length === 0) return {
      totalImproved: 0,
      avgQualityImprovement: 0,
      totalTokensInvested: 0,
      avgCostPerPrompt: 0,
      successRate: 0,
      avgIterations: 0,
    };

    // Количество улучшенных промптов
    const totalImproved = filteredResults.length;
    
    // Медиана Quality Improvement Score (новая метрика)
    const qualityScores = filteredResults
      .filter(r => r.quality_improvement_score !== null && r.quality_improvement_score !== undefined)
      .map(r => r.quality_improvement_score!)
      .sort((a, b) => a - b);
    
    let medianQualityImprovement = 0;
    if (qualityScores.length > 0) {
      const mid = Math.floor(qualityScores.length / 2);
      medianQualityImprovement = qualityScores.length % 2 === 0
        ? (qualityScores[mid - 1] + qualityScores[mid]) / 2
        : qualityScores[mid];
    } else {
      // Fallback to old calculation if new metrics not available
      medianQualityImprovement = filteredResults.reduce((sum, r) => {
        return sum + Math.abs(r.improvement_percentage);
      }, 0) / filteredResults.length;
    }
    
    // Общее количество токенов, потраченных на улучшение (optimized tokens)
    const totalTokensInvested = filteredResults.reduce((sum, r) => {
      return sum + r.optimized_tokens;
    }, 0);
    
    // Средняя стоимость за промпт
    const costValues = filteredResults
      .filter(r => r.cost_cents !== null && r.cost_cents > 0)
      .map(r => r.cost_cents!);
    
    const avgCostPerPrompt = costValues.length > 0
      ? costValues.reduce((sum, c) => sum + c, 0) / costValues.length
      : (totalTokensInvested * 0.000002 * 100) / filteredResults.length;
    
    // Success rate - процент принятых результатов
    const acceptedResults = filteredResults.filter(r => r.accepted === true);
    const successRate = filteredResults.length > 0 ? ((acceptedResults.length / filteredResults.length) * 100) : 0;
    
    // Среднее количество итераций для улучшения
    const avgIterations = filteredResults.reduce((sum, r) => {
      return sum + r.iterations;
    }, 0) / filteredResults.length;

    return {
      totalImproved: totalImproved,
      avgQualityImprovement: medianQualityImprovement.toFixed(1),
      totalTokensInvested: totalTokensInvested,
      avgCostPerPrompt: avgCostPerPrompt.toFixed(2),
      successRate: successRate.toFixed(1),
      avgIterations: avgIterations.toFixed(1),
    };
  };

  const exportToCSV = () => {
    const displayResults = getDisplayResults();
    
    if (displayResults.length === 0) {
      toast({
        title: t('analytics.noData'),
        description: t('analytics.nothingToExport'),
        variant: "destructive",
      });
      return;
    }

    const headers = [
      t('analytics.date'),
      t('carousel.originalPrompt'),
      t('carousel.optimizedPrompt'),
      t('carousel.tokensBefore'),
      t('carousel.tokensAfter'),
      t('analytics.improvement'),
      'Quality Improvement',
      'Quality Gain',
      'Compression',
      'Old Score',
      'New Score',
      t('analytics.iterations'),
      'A/B Winner',
      'A/B Notes'
    ];

    const rows = displayResults.map(r => [
      new Date(r.created_at).toLocaleString(),
      `"${r.original_prompt.replace(/"/g, '""')}"`,
      `"${r.optimized_prompt.replace(/"/g, '""')}"`,
      r.original_tokens,
      r.optimized_tokens,
      r.improvement_percentage.toFixed(2),
      r.quality_improvement_score?.toFixed(2) ?? 'N/A',
      r.quality_gain_percentage?.toFixed(2) ?? 'N/A',
      r.compression_percentage?.toFixed(2) ?? 'N/A',
      r.old_quality_score?.toFixed(2) ?? 'N/A',
      r.new_quality_score?.toFixed(2) ?? 'N/A',
      r.iterations,
      r.ab_test_winner || '',
      r.ab_test_notes ? `"${r.ab_test_notes.replace(/"/g, '""')}"` : ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tfm-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: t('analytics.exportCompleted'),
      description: t('analytics.exportedRecords').replace('{count}', String(displayResults.length)),
    });
  };

  const exportToJSON = () => {
    const displayResults = getDisplayResults();
    
    if (displayResults.length === 0) {
      toast({
        title: t('analytics.noData'),
        description: t('analytics.nothingToExport'),
        variant: "destructive",
      });
      return;
    }

    const json = JSON.stringify(displayResults, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tfm-analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    toast({
      title: t('analytics.exportCompleted'),
      description: t('analytics.exportedRecords').replace('{count}', String(displayResults.length)),
    });
  };

  const getDisplayResults = () => {
    let filteredResults = results;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredResults = filteredResults.filter(r => 
        r.original_prompt.toLowerCase().includes(query) ||
        r.optimized_prompt.toLowerCase().includes(query) ||
        r.ab_test_notes?.toLowerCase().includes(query)
      );
    }

    return filteredResults;
  };

  const stats = calculateStats();
  const displayResults = getDisplayResults();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pt-4 sm:pt-0">
      {/* Header */}
      <div className="border-b glass-effect sticky top-0 z-10 flex-shrink-0 pt-4 sm:pt-0">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size={isMobile ? "icon" : "sm"}
                onClick={() => navigate('/')}
                className="gap-2 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                {!isMobile && t('analytics.back')}
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className={cn(
                  "font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent",
                  isMobile ? "text-lg" : "text-3xl"
                )}>
                  {isMobile ? t('analytics.shortTitle') : t('analytics.title')}
                </h1>
                {!isMobile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('analytics.subtitle')}
                  </p>
                )}
              </div>
            </div>
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="border-b bg-card/30 backdrop-blur-sm flex-shrink-0">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            {/* Date Filters */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  {dateFrom || dateTo ? t('analytics.filterActive') : t('analytics.selectDates')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-4 space-y-4">
                  <div>
                    <Label className="text-xs mb-2 block">{t('analytics.from')}</Label>
                    <CalendarComponent
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-2 block">{t('analytics.to')}</Label>
                    <CalendarComponent
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDateFrom(undefined);
                        setDateTo(undefined);
                      }}
                      className="flex-1"
                    >
                      {t('analytics.reset')}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Export Buttons */}
            <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
              <Download className="w-4 h-4" />
              {!isMobile && t('analytics.exportCSV')}
            </Button>
            <Button variant="outline" size="sm" onClick={exportToJSON} className="gap-2">
              <Download className="w-4 h-4" />
              {!isMobile && t('analytics.exportJSON')}
            </Button>
            <Button 
              variant="outline"
              size="sm"
              disabled={isRecalculating}
              onClick={async () => {
                try {
                  setIsRecalculating(true);
                  toast({
                    title: t('analytics.recalculating'),
                    description: t('analytics.recalculating'),
                  });

                  const { data, error } = await supabase.functions.invoke('recalculate-quality-metrics', {
                    body: {}
                  });

                  if (error) throw error;

                  toast({
                    title: t('analytics.recalculationComplete'),
                    description: t('analytics.processedResults')
                      .replace('{processed}', data.processed)
                      .replace('{errors}', data.errors),
                  });

                  // Reload results
                  loadResults();
                } catch (error) {
                  console.error('Recalculation error:', error);
                  toast({
                    title: t('common.error'),
                    description: error instanceof Error ? error.message : "Failed to recalculate metrics",
                    variant: "destructive",
                  });
                } finally {
                  setIsRecalculating(false);
                }
              }}
              className="gap-2"
            >
              {isRecalculating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {!isMobile && "..."}
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  {!isMobile && t('analytics.recalculateMetrics')}
                </>
              )}
            </Button>
            <Button
              variant="default" 
              size="sm" 
              onClick={() => {
                const reportData = {
                  title: "TRI/TFM - " + t('analytics.reportReady'),
                  date: new Date().toLocaleDateString(),
                  summary: {
                    totalImproved: stats.totalImproved,
                    dateRange: {
                      from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : t('analytics.from'),
                      to: dateTo ? format(dateTo, 'yyyy-MM-dd') : t('analytics.to')
                    }
                  },
                  kpis: {
                    successRate: `${stats.successRate}%`,
                    avgQualityImprovement: `${stats.avgQualityImprovement}%`,
                    avgCostPerPrompt: `${stats.avgCostPerPrompt}¢`,
                    avgIterations: `${stats.avgIterations}`,
                    totalTokensInvested: `${stats.totalTokensInvested.toLocaleString()}`
                  },
                  metrics: {
                    successRate: parseFloat(String(stats.successRate)),
                    avgQualityImprovement: parseFloat(String(stats.avgQualityImprovement)),
                    avgCostPerPrompt: parseFloat(String(stats.avgCostPerPrompt)),
                    avgIterations: parseFloat(String(stats.avgIterations)),
                    totalTokensInvested: stats.totalTokensInvested
                  }
                };
                
                const json = JSON.stringify(reportData, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `quality-report-${new Date().toISOString().split('T')[0]}.json`;
                link.click();

                toast({
                  title: t('analytics.reportExported'),
                  description: t('analytics.reportReady'),
                });
              }}
              className="gap-2 gradient-primary"
            >
              <Download className="w-4 h-4" />
              {!isMobile && t('analytics.exportReport')}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={t('analytics.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card className="floating-card border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5" style={{ animationDelay: '0s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                {t('analytics.promptsImproved')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.totalImproved}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('analytics.totalOptimizations')}</p>
            </CardContent>
          </Card>

          <Card className="floating-card border-2 border-accent/20 bg-gradient-to-br from-accent/10 to-accent/5" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {t('analytics.qualityImprovement')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.avgQualityImprovement}%</div>
              <p className="text-xs text-muted-foreground mt-1">{t('analytics.avgQualityGain')}</p>
            </CardContent>
          </Card>

          <Card className="floating-card border-2" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4" />
                {t('analytics.tokensInvested')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalTokensInvested.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('analytics.totalTokensUsed')}</p>
            </CardContent>
          </Card>

          <Card className="floating-card border-2" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Award className="w-4 h-4" />
                {t('analytics.costPerPrompt')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.avgCostPerPrompt}¢</div>
              <p className="text-xs text-muted-foreground mt-1">{t('analytics.avgCostInCents')}</p>
            </CardContent>
          </Card>

          <Card className="floating-card border-2" style={{ animationDelay: '0.4s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                {t('analytics.successRate')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.successRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">{t('analytics.acceptedResults')}</p>
            </CardContent>
          </Card>

          <Card className="floating-card border-2" style={{ animationDelay: '0.5s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4" />
                {t('analytics.iterations')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.avgIterations}</div>
              <p className="text-xs text-muted-foreground mt-1">{t('analytics.avgIterationsNeeded')}</p>
            </CardContent>
          </Card>

        </div>

        {/* Analytics Charts */}
        <AnalyticsCharts results={displayResults} />

        {/* Recent Optimizations */}
        <Card className="floating-card border-2 shadow-lg" style={{ animationDelay: '0.6s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              {t('analytics.optimizationHistory')}
            </CardTitle>
            <CardDescription>{t('analytics.recentResults')}</CardDescription>
          </CardHeader>
          <CardContent>
            {displayResults.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t('analytics.noData')}</p>
                <p className="text-sm mt-2">
                  {t('tfmController.enterTextToOptimize')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayResults.slice(0, 10).map((result, index) => (
                <div
                    key={result.id}
                    className="p-3 sm:p-4 rounded-lg border bg-card hover:shadow-md transition-all hover:border-primary/50"
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                      <div 
                        className="flex-1 space-y-2 cursor-pointer"
                        onClick={() => {
                          setSelectedIndex(index);
                          setCarouselOpen(true);
                        }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {result.quality_improvement_score !== null && result.quality_improvement_score !== undefined ? (
                              <>
                                <span className={`text-xl sm:text-2xl font-bold ${result.quality_improvement_score >= 0 ? 'text-primary' : 'text-destructive'}`}>
                                  {result.quality_improvement_score > 0 ? '+' : ''}{result.quality_improvement_score.toFixed(1)}%
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  QG: {result.quality_gain_percentage?.toFixed(1) ?? 'N/A'}%
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Comp: {result.compression_percentage?.toFixed(1) ?? 'N/A'}%
                                </Badge>
                              </>
                            ) : (
                              <span className="text-xl sm:text-2xl font-bold text-primary">
                                +{Math.abs(result.improvement_percentage).toFixed(1)}%
                              </span>
                            )}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            {new Date(result.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              a={result.a_parameter}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              b={result.b_parameter}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {result.iterations} {t('analytics.iterations').toLowerCase()}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm line-clamp-2 text-muted-foreground">
                          {result.original_prompt}
                        </p>
                      </div>
                      <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedIndex(index);
                            setCarouselOpen(true);
                          }}
                          className="gap-2 flex-1 sm:flex-auto"
                        >
                          <BarChart3 className="w-4 h-4" />
                          {!isMobile && t('analytics.viewAnalysis')}
                        </Button>
                        <ComparisonModal
                          originalPrompt={result.original_prompt}
                          optimizedPrompt={result.optimized_prompt}
                          originalTokens={result.original_tokens}
                          optimizedTokens={result.optimized_tokens}
                          improvementPercentage={result.improvement_percentage}
                          iterations={result.iterations}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      <PromptCarouselModal
        results={displayResults.slice(0, 10)}
        initialIndex={selectedIndex}
        open={carouselOpen}
        onOpenChange={setCarouselOpen}
      />
    </div>
  );
}
