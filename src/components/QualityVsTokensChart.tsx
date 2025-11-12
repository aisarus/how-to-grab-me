import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { Activity } from 'lucide-react';

interface OptimizationResult {
  id: string;
  original_tokens: number;
  optimized_tokens: number;
  old_quality_score?: number | null;
  new_quality_score?: number | null;
  reasoning_gain_index?: number | null;
}

interface QualityVsTokensChartProps {
  results: OptimizationResult[];
}

export const QualityVsTokensChart = ({ results }: QualityVsTokensChartProps) => {
  // Filter results that have quality scores
  const validResults = results.filter(r => 
    r.old_quality_score != null && 
    r.new_quality_score != null &&
    r.reasoning_gain_index != null
  );

  if (validResults.length === 0) {
    return null;
  }

  // Prepare data points for initial state
  const initialData = validResults.map(r => ({
    tokens: r.original_tokens,
    quality: r.old_quality_score!,
    type: 'initial',
    id: r.id,
  }));

  // Prepare data points for optimized state
  const optimizedData = validResults.map(r => ({
    tokens: r.optimized_tokens,
    quality: r.new_quality_score!,
    type: 'optimized',
    id: r.id,
    rgi: r.reasoning_gain_index!,
  }));

  // Find saturation point (where RGI ≈ 0)
  const saturationPoints = validResults
    .filter(r => Math.abs(r.reasoning_gain_index!) < 0.1) // RGI close to 0
    .map(r => r.optimized_tokens);
  
  const avgSaturationPoint = saturationPoints.length > 0
    ? saturationPoints.reduce((a, b) => a + b, 0) / saturationPoints.length
    : null;

  // Calculate axis ranges
  const allTokens = [...initialData, ...optimizedData].map(d => d.tokens);
  const allQualities = [...initialData, ...optimizedData].map(d => d.quality);
  const minTokens = Math.min(...allTokens);
  const maxTokens = Math.max(...allTokens);
  const minQuality = Math.min(...allQualities);
  const maxQuality = Math.max(...allQualities);

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-primary" />
          Quality vs Tokens: Зависимость качества от длины
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              type="number" 
              dataKey="tokens" 
              name="Токены" 
              domain={[minTokens * 0.9, maxTokens * 1.1]}
              label={{ 
                value: 'Количество токенов', 
                position: 'insideBottom', 
                offset: -10,
                style: { fill: 'hsl(var(--foreground))' }
              }}
            />
            <YAxis 
              type="number" 
              dataKey="quality" 
              name="Качество" 
              domain={[Math.max(0, minQuality - 5), Math.min(100, maxQuality + 5)]}
              label={{ 
                value: 'Качество (EFMNB балл 0-100)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: 'hsl(var(--foreground))' }
              }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value: number, name: string) => {
                if (name === 'Качество') return [value?.toFixed(2) ?? 'N/A', name];
                return [value, name];
              }}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              wrapperStyle={{ paddingBottom: '20px' }}
            />
            
            {/* Saturation line */}
            {avgSaturationPoint && (
              <ReferenceLine 
                x={avgSaturationPoint} 
                stroke="hsl(var(--primary))" 
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{ 
                  value: 'Точка насыщения (RGI ≈ 0)', 
                  position: 'top',
                  fill: 'hsl(var(--primary))',
                  fontSize: 12
                }}
              />
            )}

            {/* Initial state points */}
            <Scatter 
              name="Исходное качество" 
              data={initialData} 
              fill="hsl(0, 84%, 60%)" 
              opacity={0.7}
              shape="circle"
            />
            
            {/* Optimized state points */}
            <Scatter 
              name="Оптимизированное качество" 
              data={optimizedData} 
              fill="hsl(142, 76%, 36%)" 
              opacity={0.7}
              shape="triangle"
            />
          </ScatterChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground mt-4">
          🔴 Круги — исходное состояние | 🔺 Треугольники — оптимизированное состояние
          <br />
          Пунктирная линия — точка насыщения (RGI ≈ 0), где дополнительные токены не улучшают качество
        </p>
      </CardContent>
    </Card>
  );
};