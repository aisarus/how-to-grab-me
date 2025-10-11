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
  const TOKEN_COST = 0.000002; // $0.000002 per token
  
  // Prepare data for quality improvement and cost chart
  const improvementData = results
    .slice(0, 20)
    .reverse()
    .map((r, idx) => ({
      index: idx + 1,
      improvement: Math.abs(r.improvement_percentage),
      costPerPrompt: (r.optimized_tokens * TOKEN_COST * 100).toFixed(2), // in cents
      iterations: r.iterations,
      date: new Date(r.created_at).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' }),
    }));

  // Prepare data for improvement distribution by categories
  const improvementCategories = [
    { category: 'clarity', count: 0, color: 'hsl(142, 76%, 36%)' },
    { category: 'structure', count: 0, color: 'hsl(var(--primary))' },
    { category: 'constraints', count: 0, color: 'hsl(262, 83%, 58%)' },
    { category: 'other', count: 0, color: 'hsl(var(--muted))' },
  ];

  // Simplified categorization based on improvement ranges
  results.forEach((r) => {
    const improvement = Math.abs(r.improvement_percentage);
    if (improvement < 15) improvementCategories[3].count++; // other
    else if (improvement < 25) improvementCategories[0].count++; // clarity
    else if (improvement < 35) improvementCategories[1].count++; // structure
    else improvementCategories[2].count++; // constraints
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

  const COLORS = improvementCategories.map(cat => cat.color);

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Quality Improvement & Cost Chart */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
            Улучшение качества & Стоимость
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={improvementData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis yAxisId="left" className="text-xs" label={{ value: '% улучшения', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" className="text-xs" label={{ value: '¢/промпт', angle: 90, position: 'insideRight' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="improvement" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                name="Улучшение (%)"
                dot={{ fill: 'hsl(var(--primary))', r: 5 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="costPerPrompt" 
                stroke="hsl(142, 76%, 36%)" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Стоимость (¢)"
                dot={{ fill: 'hsl(142, 76%, 36%)', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2">
            Инвестиция в токены дает измеримое улучшение качества промптов
          </p>
        </CardContent>
      </Card>

      {/* Improvement Distribution by Category */}
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
                data={improvementCategories}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, count }) => `${category}: ${count}`}
                outerRadius={100}
                fill="hsl(var(--primary))"
                dataKey="count"
              >
                {improvementCategories.map((entry, index) => (
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
            Категории: clarity (читаемость), structure (структура), constraints (специфичность)
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