import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

async function pairwiseComparePromptsWithVotes(oldPrompt: string, newPrompt: string): Promise<number[]> {
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
            content: `You are a pairwise prompt quality judge. Compare OLD vs NEW prompts across 4 EFMNB dimensions:

1. CLARITY: How clear and unambiguous
2. STRUCTURE: Organization and logical flow  
3. CONSTRAINTS: Preventing hallucinations, guiding output
4. FACTUALITY: Grounded in verifiable requirements

For each dimension, vote:
+1.0  = NEW is significantly better
+0.66 = NEW is moderately better
+0.33 = NEW is slightly better
0     = Equal quality
-0.33 = OLD is slightly better
-0.66 = OLD is moderately better
-1.0  = OLD is significantly better

Return ONLY a JSON object with votes array:
{
  "votes": [<vote1>, <vote2>, <vote3>, <vote4>]
}

Example: {"votes": [0.66, 0.33, 0.0, 1.0]}`
          },
          {
            role: 'user',
            content: `Compare these prompts:

OLD PROMPT:
${oldPrompt}

NEW PROMPT:
${newPrompt}`
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error('Pairwise comparison failed, using neutral votes');
      return [0, 0, 0, 0];
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    const votes = parsed.votes || [0, 0, 0, 0];
    
    return votes;
  } catch (error) {
    console.error('Failed to perform pairwise comparison:', error);
    return [0, 0, 0, 0];
  }
}

function calculateModeFreeMetrics(
  Ti: number,
  Tf: number,
  judgeVotes: number[],
  lambda: number = 0.2
): {
  deltaQ: number;
  deltaT: number;
  qualityGainPercent: number;
  compactnessPercent: number;
  rgi: number;
  rgiPercent: number;
  efficiency: number;
  efficiencyPercent: number;
} {
  // ΔQ = mean(judge_votes)
  const deltaQ = judgeVotes.reduce((sum, v) => sum + v, 0) / judgeVotes.length;
  
  // dT = (Tf - Ti) / max(Ti, 1)
  const deltaT = (Tf - Ti) / Math.max(Ti, 1);
  
  // Compactness% = -100 * dT
  const compactnessPercent = -100 * deltaT;
  
  // QG% = 100 * ΔQ
  const qualityGainPercent = 100 * deltaQ;
  
  // RGI = ΔQ / max(|dT|, 1e-6)
  const rgi = deltaQ / Math.max(Math.abs(deltaT), 1e-6);
  const rgiPercent = 100 * rgi;
  
  // Efficiency = ΔQ - λ * dT
  const efficiency = deltaQ - lambda * deltaT;
  const efficiencyPercent = 100 * efficiency;
  
  return {
    deltaQ: Math.round(deltaQ * 10000) / 10000,
    deltaT: Math.round(deltaT * 10000) / 10000,
    qualityGainPercent: Math.round(qualityGainPercent * 100) / 100,
    compactnessPercent: Math.round(compactnessPercent * 100) / 100,
    rgi: Math.round(rgi * 10000) / 10000,
    rgiPercent: Math.round(rgiPercent * 100) / 100,
    efficiency: Math.round(efficiency * 10000) / 10000,
    efficiencyPercent: Math.round(efficiencyPercent * 100) / 100,
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

    // Fetch all results that don't have new mode-free metrics yet
    const { data: results, error: fetchError } = await supabase
      .from('optimization_results')
      .select('*')
      .or('delta_q.is.null,delta_t.is.null,efficiency_score.is.null')
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

        // Validate prompt sizes before processing
        const MAX_PROMPT_LENGTH = 100000;
        if (result.original_prompt && result.original_prompt.length > MAX_PROMPT_LENGTH) {
          console.warn(`Skipping result ${result.id}: original prompt too large`);
          errors++;
          continue;
        }
        if (result.optimized_prompt && result.optimized_prompt.length > MAX_PROMPT_LENGTH) {
          console.warn(`Skipping result ${result.id}: optimized prompt too large`);
          errors++;
          continue;
        }

        // Pairwise comparison
        const judgeVotes = await pairwiseComparePromptsWithVotes(
          result.original_prompt,
          result.optimized_prompt
        );

        // Calculate mode-free metrics
        const metrics = calculateModeFreeMetrics(
          result.original_tokens,
          result.optimized_tokens,
          judgeVotes,
          result.lambda_tradeoff || 0.2
        );

        // Update the result
        const { error: updateError } = await supabase
          .from('optimization_results')
          .update({
            judge_votes: judgeVotes,
            delta_q: metrics.deltaQ,
            delta_t: metrics.deltaT,
            quality_gain_percentage: metrics.qualityGainPercent,
            compactness_percentage: metrics.compactnessPercent,
            reasoning_gain_index: metrics.rgiPercent,
            efficiency_score: metrics.efficiency,
            efficiency_percentage: metrics.efficiencyPercent,
          })
          .eq('id', result.id);

        if (updateError) {
          console.error(`Failed to update result ${result.id}:`, updateError);
          errors++;
        } else {
          processed++;
          console.log(`✓ Updated result ${result.id} (ΔQ: ${metrics.deltaQ.toFixed(4)}, RGI: ${metrics.rgiPercent.toFixed(2)}%, Eff: ${metrics.efficiencyPercent.toFixed(2)}%)`);
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
