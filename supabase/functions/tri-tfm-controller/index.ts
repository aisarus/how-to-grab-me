import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

interface TFMConfig {
  a: number;
  b: number;
  I: number;
  R: number;
  maxIterations: number;
  convergenceThreshold: number;
  useEFMNB: boolean;
  eriksonStage?: number;
  useProposerCriticVerifier: boolean;
  proposerCriticOnly: boolean;
}

interface ModeFreeMetrics {
  deltaQ: number;
  deltaT: number;
  qualityGainPercent: number;
  compactnessPercent: number;
  rgi: number;
  rgiPercent: number;
  efficiency: number;
  efficiencyPercent: number;
  judgeVotes: number[];
}

interface TFMResponse {
  finalText: string;
  iterations: number;
  tokenHistory: number[];
  converged: boolean;
  savings: {
    initialTokens: number;
    finalTokens: number;
    percentageSaved: number;
  };
  modeFreeMetrics: ModeFreeMetrics;
  promptImprovement?: {
    originalPrompt: string;
    improvedPrompt: string;
    improvements: string[];
  };
  telemetry: {
    accepted: boolean;
    accepted_iter: number | null;
    tta_sec: number;
    cost_cents: number;
    cost_variance_cents: number;
    tokens_breakdown: {
      orig: number;
      refine: number;
      final: number;
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, config } = await req.json();
    
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tfmConfig: TFMConfig = {
      a: config?.a ?? 0.20,
      b: config?.b ?? 0.35,
      I: config?.I ?? 50,
      R: config?.R ?? 100,
      maxIterations: config?.maxIterations ?? 10,
      convergenceThreshold: config?.convergenceThreshold ?? 0.05,
      useEFMNB: config?.useEFMNB ?? true,
      eriksonStage: config?.eriksonStage,
      useProposerCriticVerifier: config?.useProposerCriticVerifier ?? false,
      proposerCriticOnly: config?.proposerCriticOnly ?? false,
    };

    console.log('Starting TRI/TFM controller with config:', tfmConfig);

    // No need to evaluate initial quality anymore - we'll do pairwise comparison at the end

    let promptImprovement = undefined;
    let workingPrompt = prompt;
    
    if (tfmConfig.useProposerCriticVerifier) {
      console.log('\n=== Proposer-Critic-Verifier: Improving prompt ===');
      const improved = await improvePrompt(prompt);
      promptImprovement = improved;
      workingPrompt = improved.improvedPrompt;
      console.log('Original prompt length:', estimateTokens(prompt));
      console.log('Improved prompt length:', estimateTokens(workingPrompt));
      console.log('Improvements:', improved.improvements);
    }

    // Proposer–Critic only mode: skip D/S loop and Arbiter entirely
    if (tfmConfig.proposerCriticOnly) {
      console.log('\n=== Proposer–Critic only mode ===');
      let pcCurrent = prompt;
      const pcTokenHistory: number[] = [estimateTokens(pcCurrent)];
      let pcIteration = 0;
      let lastImprovement: { originalPrompt: string; improvedPrompt: string; improvements: string[] } | undefined = undefined;
      const pcStart = Date.now();

      while (pcIteration < tfmConfig.maxIterations) {
        pcIteration++;
        const improved = await improvePrompt(pcCurrent);
        lastImprovement = improved;
        if (improved.improvedPrompt && improved.improvedPrompt.trim() !== '' && improved.improvedPrompt !== pcCurrent) {
          pcCurrent = improved.improvedPrompt;
          pcTokenHistory.push(estimateTokens(pcCurrent));
        } else {
          break;
        }
      }

      // Pairwise comparison: OLD vs NEW
      console.log('Performing pairwise comparison...');
      const judgeVotes = await pairwiseComparePromptsWithVotes(prompt, pcCurrent);
      const deltaQ = judgeVotes.reduce((sum, v) => sum + v, 0) / judgeVotes.length;

      const initialTokens = estimateTokens(prompt);
      const finalTokens = estimateTokens(pcCurrent);
      const percentageSaved = ((initialTokens - finalTokens) / initialTokens) * 100;
      const ttaSec = (Date.now() - pcStart) / 1000;

      const modeFreeMetrics = calculateModeFreeMetrics(initialTokens, finalTokens, deltaQ, judgeVotes);

      const TOKEN_COST = 0.000002;
      const costCents = (finalTokens * TOKEN_COST) * 100;

      // Simple variance on PC history
      const avgTokens = pcTokenHistory.reduce((s, t) => s + t, 0) / pcTokenHistory.length;
      const variance = pcTokenHistory.reduce((s, t) => s + Math.pow(t - avgTokens, 2), 0) / pcTokenHistory.length;
      const stdDev = Math.sqrt(variance);
      const costVarianceCents = (stdDev * TOKEN_COST) * 100;

      const response: TFMResponse = {
        finalText: pcCurrent,
        iterations: pcIteration,
        tokenHistory: pcTokenHistory,
        converged: pcIteration < tfmConfig.maxIterations,
        savings: {
          initialTokens,
          finalTokens,
          percentageSaved: Math.round(percentageSaved * 100) / 100,
        },
        modeFreeMetrics,
        promptImprovement: lastImprovement,
        telemetry: {
          accepted: pcIteration < tfmConfig.maxIterations,
          accepted_iter: pcIteration < tfmConfig.maxIterations ? pcIteration : null,
          tta_sec: Math.round(ttaSec * 10) / 10,
          cost_cents: Math.round(costCents * 100) / 100,
          cost_variance_cents: Math.round(costVarianceCents * 100) / 100,
          tokens_breakdown: {
            orig: initialTokens,
            refine: finalTokens - initialTokens,
            final: finalTokens,
          },
        },
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let currentText = workingPrompt;
    let currentTokens = estimateTokens(currentText);
    const tokenHistory: number[] = [currentTokens];
    let iteration = 0;
    let converged = false;
    let acceptedIteration: number | null = null;
    const startTime = Date.now();

    const initialTokens = currentTokens;
    const originalTokens = estimateTokens(prompt);
    const refineTokens = promptImprovement ? estimateTokens(workingPrompt) - originalTokens : 0;

    while (iteration < tfmConfig.maxIterations) {
      iteration++;
      console.log(`\n=== Iteration ${iteration} ===`);
      console.log(`Current tokens: ${currentTokens}`);

      console.log('Running D block (expansion)...');
      const expandedText = await callDBlock(currentText, tfmConfig.useEFMNB);
      const expandedTokens = estimateTokens(expandedText);
      console.log(`After D: ${expandedTokens} tokens`);

      console.log('Running S block (stabilization)...');
      const stabilizedText = await callSBlock(expandedText, tfmConfig.eriksonStage);
      const stabilizedTokens = estimateTokens(stabilizedText);
      console.log(`After S: ${stabilizedTokens} tokens`);

      tokenHistory.push(stabilizedTokens);

      // Classic convergence logic
      const tokenDiff = Math.abs(stabilizedTokens - currentTokens);
      const changeRate = tokenDiff / currentTokens;

      console.log(`Iteration ${iteration}: ${currentTokens} → ${stabilizedTokens} tokens (${(changeRate * 100).toFixed(2)}% change)`);
      
      currentText = stabilizedText;
      currentTokens = stabilizedTokens;

      // Check classic convergence
      if (changeRate < tfmConfig.convergenceThreshold) {
        console.log('Classic convergence achieved!');
        converged = true;
        acceptedIteration = iteration;
        break;
      }
    }

    const finalTokens = currentTokens;
    const percentageSaved = ((initialTokens - finalTokens) / initialTokens) * 100;
    const endTime = Date.now();
    const ttaSec = (endTime - startTime) / 1000;

    // Pairwise comparison: original prompt vs final text
    console.log('Performing pairwise comparison...');
    const judgeVotes = await pairwiseComparePromptsWithVotes(prompt, currentText);
    const deltaQ = judgeVotes.reduce((sum, v) => sum + v, 0) / judgeVotes.length;

    const modeFreeMetrics = calculateModeFreeMetrics(originalTokens, finalTokens, deltaQ, judgeVotes);

    // Calculate cost metrics (using $0.000002 per token as example rate)
    const TOKEN_COST = 0.000002;
    const costDollars = finalTokens * TOKEN_COST;
    const costCents = costDollars * 100;
    
    // Cost variance based on token history variation
    const avgTokens = tokenHistory.reduce((sum, t) => sum + t, 0) / tokenHistory.length;
    const variance = tokenHistory.reduce((sum, t) => sum + Math.pow(t - avgTokens, 2), 0) / tokenHistory.length;
    const stdDev = Math.sqrt(variance);
    const costVarianceCents = (stdDev * TOKEN_COST) * 100;

    const response: TFMResponse = {
      finalText: currentText,
      iterations: iteration,
      tokenHistory,
      converged,
      savings: {
        initialTokens,
        finalTokens,
        percentageSaved: Math.round(percentageSaved * 100) / 100,
      },
      modeFreeMetrics,
      promptImprovement,
      telemetry: {
        accepted: converged,
        accepted_iter: acceptedIteration,
        tta_sec: Math.round(ttaSec * 10) / 10,
        cost_cents: Math.round(costCents * 100) / 100,
        cost_variance_cents: Math.round(costVarianceCents * 100) / 100,
        tokens_breakdown: {
          orig: originalTokens,
          refine: refineTokens,
          final: finalTokens,
        },
      },
    };

    console.log('\n=== Final Results ===');
    console.log(`Iterations: ${iteration}`);
    console.log(`Initial tokens: ${initialTokens}`);
    console.log(`Final tokens: ${finalTokens}`);
    console.log(`Savings: ${percentageSaved.toFixed(2)}%`);
    console.log(`Converged: ${converged}`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in TRI/TFM controller:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function pairwiseComparePromptsWithVotes(oldPrompt: string, newPrompt: string): Promise<number[]> {
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
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    const votes = parsed.votes || [0, 0, 0, 0];
    
    console.log(`Pairwise comparison votes: ${JSON.stringify(votes)}`);
    return votes;
  } catch (error) {
    console.error('Failed to parse comparison result:', error);
    return [0, 0, 0, 0];
  }
}

function calculateModeFreeMetrics(
  Ti: number,
  Tf: number,
  deltaQ: number,
  judgeVotes: number[],
  lambda: number = 0.2
): ModeFreeMetrics {
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
    judgeVotes,
  };
}

const ERIKSON_STAGES = {
  1: { name: 'Trust vs. Mistrust', virtue: 'Hope', focus: 'Basic safety and reliability' },
  2: { name: 'Autonomy vs. Shame', virtue: 'Will', focus: 'Independence and self-control' },
  3: { name: 'Initiative vs. Guilt', virtue: 'Purpose', focus: 'Taking initiative and planning' },
  4: { name: 'Industry vs. Inferiority', virtue: 'Competence', focus: 'Mastery and productivity' },
  5: { name: 'Identity vs. Role Confusion', virtue: 'Fidelity', focus: 'Identity formation and values' },
  6: { name: 'Intimacy vs. Isolation', virtue: 'Love', focus: 'Deep relationships and commitment' },
  7: { name: 'Generativity vs. Stagnation', virtue: 'Care', focus: 'Contribution and legacy' },
  8: { name: 'Integrity vs. Despair', virtue: 'Wisdom', focus: 'Life reflection and acceptance' },
};

async function callDBlock(text: string, useEFMNB: boolean): Promise<string> {
  const systemPrompt = useEFMNB 
    ? `You are the D (Developer) block in a TRI/TFM system with EFMNB framing.

EFMNB Structure (Emotional-Factual Matrix Next Build):
Your expansion must follow this logical frame:
1. EVALUATION 1: Identify and evaluate the core elements/concepts in the text
2. EVALUATION 2: Assess the relationships and context around these elements
3. COMPARISON: Compare different aspects, perspectives, or interpretations
4. CONCLUSION: Synthesize into a coherent expanded narrative

Key principles:
- Make each step transparent and explicit
- Add structure and missing details through the EFMNB lens
- Expand by 20-30% while maintaining logical consistency
- Frame the text as a structured reasoning process`
    : `You are the D (Developer) block in a TRI/TFM system. Your role is to:
1. Expand and structure the input text
2. Add missing details and context
3. Improve clarity and completeness
4. Maintain the core message and intent

Keep the expansion moderate - aim for 20-30% more content.`;

  const response = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`D Block failed: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callSBlock(text: string, eriksonStage?: number): Promise<string> {
  let systemPrompt = `You are the S (Stabilizer) block in a TRI/TFM system. Your role is to:
1. Remove redundancy and excessive details
2. Normalize and condense the text
3. Keep only essential information
4. Maintain clarity and coherence

Aim to reduce the text by 30-40% while preserving all key information.`;

  if (eriksonStage && eriksonStage >= 1 && eriksonStage <= 8) {
    const stage = ERIKSON_STAGES[eriksonStage as keyof typeof ERIKSON_STAGES];
    systemPrompt = `You are the S (Stabilizer) block in a TRI/TFM system with Erikson's psychosocial development lens.

Apply STAGE ${eriksonStage}: ${stage.name} (Virtue: ${stage.virtue})

Filter and condense the text through this developmental stage:
- Focus: ${stage.focus}
- Virtue to preserve: ${stage.virtue}
- Remove content that doesn't align with this stage's core conflict and resolution

Key principles:
1. Identify elements relevant to "${stage.name}" conflict
2. Preserve insights related to "${stage.virtue}" virtue
3. Remove redundancy that doesn't contribute to "${stage.focus}"
4. Condense by 30-40% while keeping stage-relevant essence

This creates mature, focused text filtered through psychosocial development theory.`;
  }

  const response = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`S Block failed: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function improvePrompt(prompt: string): Promise<{
  originalPrompt: string;
  improvedPrompt: string;
  improvements: string[];
}> {
  
  const proposerResponse = await fetch(AI_GATEWAY_URL, {
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
          content: `You are a Proposer in the TRI/TFM Proposer-Critic-Verifier system.

Your task: Transform user prompts into structured, precise, and optimized prompts that will yield better LLM responses.

Apply these improvements:
1. Add explicit structure (if missing): "First... Then... Finally..."
2. Specify desired output format: "Provide a list of...", "Explain in 3 paragraphs..."
3. Add constraints to prevent hallucinations: "Based only on...", "Cite sources..."
4. Include examples or templates if helpful
5. Break complex requests into clear sub-tasks
6. Add context that helps the model understand intent

Return JSON:
{
  "improvedPrompt": "the improved prompt text",
  "improvements": ["improvement 1", "improvement 2", ...]
}`
        },
        {
          role: 'user',
          content: `Original prompt:\n${prompt}`
        }
      ],
    }),
  });

  if (!proposerResponse.ok) {
    throw new Error(`Proposer failed: ${await proposerResponse.text()}`);
  }

  const proposerData = await proposerResponse.json();
  const proposerOutput = proposerData.choices[0].message.content;
  
  let parsed;
  try {
    const jsonMatch = proposerOutput.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : proposerOutput);
  } catch {
    return {
      originalPrompt: prompt,
      improvedPrompt: prompt,
      improvements: ['Failed to improve prompt - using original'],
    };
  }

  const criticResponse = await fetch(AI_GATEWAY_URL, {
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
          content: `You are a Critic in the TRI/TFM system. Evaluate prompt improvements.

Check:
1. Is the improved prompt clearer and more structured?
2. Does it reduce ambiguity?
3. Does it add helpful constraints?
4. Is it significantly better than the original?

Return JSON:
{
  "approved": true/false,
  "score": 0-100,
  "reasoning": "why this is good/bad"
}`
        },
        {
          role: 'user',
          content: `Original: ${prompt}\n\nImproved: ${parsed.improvedPrompt}`
        }
      ],
    }),
  });

  const criticData = await criticResponse.json();
  const criticOutput = criticData.choices[0].message.content;
  
  let criticResult;
  try {
    const jsonMatch = criticOutput.match(/\{[\s\S]*\}/);
    criticResult = JSON.parse(jsonMatch ? jsonMatch[0] : criticOutput);
  } catch {
    criticResult = { approved: true, score: 70 };
  }

  console.log('Critic evaluation:', criticResult);

  if (criticResult.approved || criticResult.score >= 60) {
    return {
      originalPrompt: prompt,
      improvedPrompt: parsed.improvedPrompt,
      improvements: parsed.improvements || ['Prompt optimized for better LLM response'],
    };
  }

  return {
    originalPrompt: prompt,
    improvedPrompt: prompt,
    improvements: ['No improvement needed - original prompt is good'],
  };
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

