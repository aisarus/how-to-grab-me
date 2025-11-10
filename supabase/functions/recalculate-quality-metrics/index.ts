import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

async function evaluatePromptQuality(prompt: string): Promise<number> {
  try {
    const response = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an EFMNB quality evaluator. Evaluate prompt quality on 4 dimensions:

1. CLARITY (0-25): How clear and unambiguous is the request?
2. STRUCTURE (0-25): How well organized and logically structured?
3. CONSTRAINTS (0-25): How well does it prevent hallucinations and guide output?
4. FACTUALITY (0-25): How grounded in specific, verifiable requirements?

Return ONLY a JSON object with the total score:
{
  "score": <number 0-100>
}`
          },
          {
            role: 'user',
            content: `Evaluate this prompt:\n${prompt}`
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error('Quality evaluation failed, using default score 50');
      return 50;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    const score = Math.max(0, Math.min(100, parsed.score || 50));
    return score;
  } catch (error) {
    console.error('Failed to evaluate quality:', error);
    return 50;
  }
}

function calculateQualityMetrics(
  initialTokens: number,
  finalTokens: number,
  oldScore: number,
  newScore: number
): {
  compression: number;
  qualityGain: number;
  qualityImprovement: number;
} {
  const epsilon = 0.01;
  
  const compression = 100 * (1 - finalTokens / initialTokens);
  const qualityGain = 100 * (newScore - oldScore) / Math.max(oldScore, epsilon);
  const qualityImprovement = 0.6 * qualityGain + 0.4 * compression;
  
  const clamp = (val: number) => Math.max(-100, Math.min(100, val));
  
  return {
    compression: Math.round(clamp(compression) * 100) / 100,
    qualityGain: Math.round(clamp(qualityGain) * 100) / 100,
    qualityImprovement: Math.round(clamp(qualityImprovement) * 100) / 100,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting quality metrics recalculation...');

    // Fetch all results that don't have quality metrics yet
    const { data: results, error: fetchError } = await supabase
      .from('optimization_results')
      .select('*')
      .or('old_quality_score.is.null,new_quality_score.is.null,quality_improvement_score.is.null')
      .order('created_at', { ascending: false })
      .limit(100); // Process 100 at a time

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${results?.length || 0} results to recalculate`);

    if (!results || results.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No results need recalculation',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processed = 0;
    let errors = 0;

    for (const result of results) {
      try {
        console.log(`Processing result ${result.id}...`);

        // Evaluate original and optimized prompts
        const oldScore = await evaluatePromptQuality(result.original_prompt);
        const newScore = await evaluatePromptQuality(result.optimized_prompt);

        // Calculate metrics
        const metrics = calculateQualityMetrics(
          result.original_tokens,
          result.optimized_tokens,
          oldScore,
          newScore
        );

        // Update the result
        const { error: updateError } = await supabase
          .from('optimization_results')
          .update({
            old_quality_score: oldScore,
            new_quality_score: newScore,
            compression_percentage: metrics.compression,
            quality_gain_percentage: metrics.qualityGain,
            quality_improvement_score: metrics.qualityImprovement,
          })
          .eq('id', result.id);

        if (updateError) {
          console.error(`Failed to update result ${result.id}:`, updateError);
          errors++;
        } else {
          processed++;
          console.log(`✓ Updated result ${result.id} (QI: ${metrics.qualityImprovement}%)`);
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error processing result ${result.id}:`, error);
        errors++;
      }
    }

    console.log(`Recalculation complete: ${processed} processed, ${errors} errors`);

    return new Response(
      JSON.stringify({ 
        message: 'Quality metrics recalculation completed',
        processed,
        errors,
        total: results.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in recalculate-quality-metrics:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});