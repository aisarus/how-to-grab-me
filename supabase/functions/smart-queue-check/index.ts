import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SmartQueueResult {
  shouldOptimize: boolean;
  clarityScore: number;
  structureScore: number;
  constraintsScore: number;
  priorityScore: number;
  recommendation: string;
  mockMode?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Valid prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await calculateSmartQueueScore(prompt);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in smart-queue-check:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function calculateSmartQueueScore(prompt: string): Promise<SmartQueueResult> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  const systemPrompt = `You are a prompt quality analyzer. Evaluate the given prompt and return ONLY a JSON object with these exact fields:
{
  "clarityScore": <number 0-100>,
  "structureScore": <number 0-100>,
  "constraintsScore": <number 0-100>
}

Scoring criteria:
- clarityScore: How clear and unambiguous is the prompt? (0=very vague, 100=crystal clear)
- structureScore: How well-organized and formatted is the prompt? (0=chaotic, 100=perfectly structured)
- constraintsScore: Does it specify requirements, format, style, length? (0=no constraints, 100=very specific)

Return ONLY valid JSON, no explanations.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI gateway error:', response.status, errorText);
    
    // Handle 402 Payment Required specifically
    if (response.status === 402) {
      // Return mock data when no credits
      const textLength = prompt.length;
      const mockScore = Math.min(100, Math.max(0, Math.round(50 + (textLength / 10))));
      
      return {
        shouldOptimize: mockScore < 70,
        clarityScore: Math.round(mockScore * 0.9),
        structureScore: Math.round(mockScore * 0.95),
        constraintsScore: Math.round(mockScore * 0.85),
        priorityScore: mockScore,
        recommendation: mockScore < 70 
          ? 'Оптимизация рекомендуется для улучшения качества.'
          : 'Промпт имеет хорошее качество.',
        mockMode: true,
      };
    }
    
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No content in AI response');
  }

  let scores;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      scores = JSON.parse(jsonMatch[0]);
    } else {
      scores = JSON.parse(content);
    }
  } catch (e) {
    console.error('Failed to parse AI response:', content);
    throw new Error('Failed to parse AI response as JSON');
  }

  const clarityScore = Math.max(0, Math.min(100, scores.clarityScore || 0));
  const structureScore = Math.max(0, Math.min(100, scores.structureScore || 0));
  const constraintsScore = Math.max(0, Math.min(100, scores.constraintsScore || 0));

  // Priority formula: weighted average emphasizing clarity
  const priorityScore = Math.round(
    (clarityScore * 0.5) + (structureScore * 0.3) + (constraintsScore * 0.2)
  );

  // Threshold: optimize if priority score < 70
  const shouldOptimize = priorityScore < 70;

  let recommendation = '';
  if (priorityScore >= 85) {
    recommendation = 'Отличный промпт! Оптимизация может дать минимальное улучшение.';
  } else if (priorityScore >= 70) {
    recommendation = 'Хороший промпт. Оптимизация может улучшить качество на 10-20%.';
  } else if (priorityScore >= 50) {
    recommendation = 'Средний промпт. Оптимизация рекомендуется для значительного улучшения.';
  } else {
    recommendation = 'Слабый промпт. Оптимизация сильно улучшит результат!';
  }

  return {
    shouldOptimize,
    clarityScore,
    structureScore,
    constraintsScore,
    priorityScore,
    recommendation,
  };
}
