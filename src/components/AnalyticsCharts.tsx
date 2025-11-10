import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, PieChart as PieIcon, BarChart3 } from 'lucide-react';

interface OptimizationResult {
  id: string;
  created_at: string;
  original_tokens: number;
  optimized_tokens: number;
  improvement_percentage: number;
  a_parameter: number;
  b_parameter: number;
  iterations: number;
  old_quality_score?: number | null;
  new_quality_score?: number | null;
  compression_percentage?: number | null;
  quality_gain_percentage?: number | null;
  quality_improvement_score?: number | null;
}

interface AnalyticsChartsProps {
  results: OptimizationResult[];
}

export const AnalyticsCharts = ({ results }: AnalyticsChartsProps) => {
  const TOKEN_COST = 0.000002; // $0.000002 per token
  
  // Prepare data for new quality metrics chart
  const improvementData = results
    .slice(0, 20)
    .reverse()
    .map((r, idx) => ({
      index: idx + 1,
      qualityImprovement: r.quality_improvement_score ?? Math.abs(r.improvement_percentage),
      qualityGain: r.quality_gain_percentage ?? 0,
      compression: r.compression_percentage ?? (100 * (1 - r.optimized_tokens / r.original_tokens)),
      costPerPrompt: parseFloat((r.optimized_tokens * TOKEN_COST * 100).toFixed(2)),
      iterations: r.iterations,
      date: new Date(r.created_at).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' }),
    }));

  // Prepare data for quality metrics distribution
  const metricsDistribution = [
    { category: 'Positive QI (>0)', count: 0, color: 'hsl(142, 76%, 36%)' },
    { category: 'Negative QI (<0)', count: 0, color: 'hsl(0, 84%, 60%)' },
    { category: 'Quality Gain+', count: 0, color: 'hsl(var(--primary))' },
    { category: 'Compression+', count: 0, color: 'hsl(262, 83%, 58%)' },
  ];

  // Categorize based on new metrics
  results.forEach((r) => {
    const qi = r.quality_improvement_score ?? 0;
    const qg = r.quality_gain_percentage ?? 0;
    const comp = r.compression_percentage ?? 0;
    
    if (qi > 0) metricsDistribution[0].count++;
    if (qi < 0) metricsDistribution[1].count++;
    if (qg > 0) metricsDistribution[2].count++;
    if (comp > 0) metricsDistribution[3].count++;
  });

  // Prepare data for parameter effectiveness
  const parameterData: { [key: string]: { totalImprovement: number; count: number } } = {};
  
  results.forEach((r) => {
    const key = `a:${r.a_parameter.toFixed(2)} b:${r.b_parameter.toFixed(2)}`;
    if (!parameterData[key]) {
      parameterData[key] = { totalImprovement: 0, count: 0 };
    }
    parameterData[key].totalImprovement += Math.abs(r.improvement_percentage);
    parameterData[key].count++;
  });

  const parameterEffectiveness = Object.entries(parameterData)
    .map(([params, data]) => ({
      params,
      avgImprovement: data.totalImprovement / data.count,
      count: data.count,
    }))
    .sort((a, b) => b.avgImprovement - a.avgImprovement)
    .slice(0, 5);

  const COLORS = metricsDistribution.map(cat => cat.color);

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Quality Metrics Over Time */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
            Метрики качества во времени
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={improvementData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" label={{ value: 'Балл (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="qualityImprovement" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                name="Quality Improvement"
                dot={{ fill: 'hsl(var(--primary))', r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="qualityGain" 
                stroke="hsl(142, 76%, 36%)" 
                strokeWidth={2}
                name="Quality Gain"
                dot={{ fill: 'hsl(142, 76%, 36%)', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="compression" 
                stroke="hsl(262, 83%, 58%)" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Compression"
                dot={{ fill: 'hsl(262, 83%, 58%)', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2">
            QI = 0.6×Quality Gain + 0.4×Compression (EFMNB оценка + сжатие токенов)
          </p>
        </CardContent>
      </Card>

      {/* Metrics Distribution */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieIcon className="w-5 h-5 text-primary" />
            Распределение результатов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={metricsDistribution.filter(m => m.count > 0)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, count }) => `${category}: ${count}`}
                outerRadius={100}
                fill="hsl(var(--primary))"
                dataKey="count"
              >
                {metricsDistribution.filter(m => m.count > 0).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2">
            Positive QI: улучшение качества, Quality Gain+: рост EFMNB балла, Compression+: сжатие токенов
          </p>
        </CardContent>
      </Card>

      {/* Parameter Effectiveness */}
      <Card className="border-2 shadow-lg lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
            Эффективность параметров (Топ 5)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={parameterEffectiveness}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="params" className="text-xs" angle={-45} textAnchor="end" height={100} />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Среднее улучшение']}
              />
              <Legend />
              <Bar 
                dataKey="avgImprovement" 
                fill="hsl(var(--primary))" 
                name="Среднее улучшение (%)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Наиболее эффективные комбинации параметров a и b
          </p>
        </CardContent>
      </Card>
    </div>
  );
};