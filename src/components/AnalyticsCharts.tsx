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
}

interface AnalyticsChartsProps {
  results: OptimizationResult[];
}

export const AnalyticsCharts = ({ results }: AnalyticsChartsProps) => {
  // Prepare data for token trend chart
  const tokenTrendData = results
    .slice(0, 20)
    .reverse()
    .map((r, idx) => ({
      index: idx + 1,
      original: r.original_tokens,
      optimized: r.optimized_tokens,
      date: new Date(r.created_at).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' }),
    }));

  // Prepare data for improvement distribution
  const improvementRanges = [
    { range: '0-10%', count: 0 },
    { range: '10-20%', count: 0 },
    { range: '20-30%', count: 0 },
    { range: '30%+', count: 0 },
  ];

  results.forEach((r) => {
    const improvement = Math.abs(r.improvement_percentage);
    if (improvement < 10) improvementRanges[0].count++;
    else if (improvement < 20) improvementRanges[1].count++;
    else if (improvement < 30) improvementRanges[2].count++;
    else improvementRanges[3].count++;
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

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Token Trend Chart */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
            Динамика токенов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={tokenTrendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
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
                dataKey="original" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={2}
                name="Оригинал"
                dot={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Line 
                type="monotone" 
                dataKey="optimized" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Оптимизированный"
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Improvement Distribution */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieIcon className="w-5 h-5 text-primary" />
            Распределение улучшений
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={improvementRanges}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ range, count }) => `${range}: ${count}`}
                outerRadius={100}
                fill="hsl(var(--primary))"
                dataKey="count"
              >
                {improvementRanges.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
        </CardContent>
      </Card>

      {/* Parameter Effectiveness */}
      <Card className="border-2 shadow-lg lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
            Эффективность параметров (топ-5)
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
            Комбинации параметров a и b с наилучшими результатами
          </p>
        </CardContent>
      </Card>
    </div>
  );
};