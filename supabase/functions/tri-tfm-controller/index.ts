import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  arbiter, 
  getDefaultConfig, 
  initArbiterState,
  type ArbiterConfig,
  type ArbiterState,
  type IterationSnapshot 
} from './arbiter.ts';

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
  useArbiter: boolean;
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
    arbiter?: {
      convergenceStreak: number;
      oscillationCount: number;
      bestIteration: number;
      bestScore: number;
      iterations: any[];
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
      useProposerCriticVerifier: config?.useProposerCriticVerifier ?? true,
      useArbiter: config?.useArbiter ?? true,
    };

    console.log('Starting TRI/TFM controller with config:', tfmConfig);
    
    // Initialize Arbiter state for automatic convergence detection
    // Arbiter = cycle governor that determines when D↔S iterations have reached
    // optimal convergence and further changes no longer improve quality
    const arbiterMode = tfmConfig.eriksonStage && tfmConfig.eriksonStage <= 4 ? 'creative' : 'tech';
    const arbiterConfig = getDefaultConfig(arbiterMode);
    arbiterConfig.budget.maxIterations = tfmConfig.maxIterations;
    const arbiterState = initArbiterState();
    
    console.log('Arbiter initialized:', { mode: arbiterMode, config: arbiterConfig });

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

    let prevSnapshot: IterationSnapshot | null = null;
    const arbiterTelemetry: any[] = [];

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

      // Вычисляем EFMNB scores для текущей итерации (только если включён Arbiter)
      const scores = tfmConfig.useArbiter 
        ? await evaluateEFMNBScores(stabilizedText)
        : { E: 0.7, F: 0.7, M: 0.7, N: 0.5, B: 0.3 };
      
      // Создаём snapshot текущей итерации
      const currSnapshot: IterationSnapshot = {
        iteration,
        text: stabilizedText,
        metrics: {
          sem: 0,
          lex: 0,
          dlen: 0,
          dstyle: 0,
          defmn: 0,
        },
        scores,
        operator: 'S', // последний оператор в цикле D→S
        tokensUsed: stabilizedTokens,
      };

      // Check if Arbiter is enabled
      if (tfmConfig.useArbiter) {
        // Вызываем Arbiter для принятия решения
        console.log('Consulting Arbiter...');
        const decision = await arbiter(
          prevSnapshot,
          currSnapshot,
          arbiterState,
          arbiterConfig,
          LOVABLE_API_KEY!
        );

        console.log(`Arbiter decision: ${decision.action}`);
        console.log(`Reason: ${decision.reason}`);
        console.log(`Metrics - Votes: ${decision.metrics.votes}, Streak: ${decision.metrics.convergenceStreak}, Quality Gate: ${decision.metrics.qualityGate}`);

        arbiterTelemetry.push(decision.telemetry);

        // Действуем на основе решения Arbiter
        if (decision.action === 'STOP_ACCEPT') {
          console.log('Arbiter: Convergence achieved!');
          converged = true;
          acceptedIteration = iteration;
          currentText = decision.text;
          currentTokens = estimateTokens(currentText);
          break;
        } else if (decision.action === 'STOP_BEST') {
          console.log('Arbiter: Stopping with best candidate');
          converged = false;
          acceptedIteration = arbiterState.bestCandidate.iteration;
          currentText = decision.text;
          currentTokens = estimateTokens(currentText);
          break;
        } else if (decision.action === 'ROLLBACK') {
          console.log('Arbiter: Rolling back to best candidate');
          currentText = decision.text;
          currentTokens = estimateTokens(currentText);
          // Продолжаем с лучшего кандидата
          continue;
        } else {
          // CONTINUE
          currentText = stabilizedText;
          currentTokens = stabilizedTokens;
          prevSnapshot = currSnapshot;
        }
      } else {
        // Arbiter disabled - use classic convergence logic
        const tokenDiff = Math.abs(stabilizedTokens - currentTokens);
        const changeRate = tokenDiff / currentTokens;

        console.log(`Iteration ${iteration}: ${currentTokens} → ${stabilizedTokens} tokens (${(changeRate * 100).toFixed(2)}% change)`);
        
        currentText = stabilizedText;
        currentTokens = stabilizedTokens;
        prevSnapshot = currSnapshot;

        // Check classic convergence
        if (changeRate < tfmConfig.convergenceThreshold) {
          console.log('Classic convergence achieved!');
          converged = true;
          acceptedIteration = iteration;
          break;
        }
      }
    }

    const finalTokens = currentTokens;
    const percentageSaved = ((initialTokens - finalTokens) / initialTokens) * 100;
    const endTime = Date.now();
    const ttaSec = (endTime - startTime) / 1000;

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
        arbiter: {
          convergenceStreak: arbiterState.convergenceStreak,
          oscillationCount: arbiterState.oscillationCount,
          bestIteration: arbiterState.bestCandidate.iteration,
          bestScore: arbiterState.bestCandidate.score,
          iterations: arbiterTelemetry,
        },
      },
    };

    console.log('\n=== Final Results ===');
    console.log(`Iterations: ${iteration}`);
    console.log(`Initial tokens: ${initialTokens}`);
    console.log(`Final tokens: ${finalTokens}`);
    console.log(`Savings: ${percentageSaved.toFixed(2)}%`);
    console.log(`Converged: ${converged}`);
    console.log(`Arbiter best iteration: ${arbiterState.bestCandidate.iteration}`);
    console.log(`Arbiter convergence streak: ${arbiterState.convergenceStreak}`);

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

/**
 * Evaluate EFMNB scores for text using AI
 */
async function evaluateEFMNBScores(text: string): Promise<{
  E: number;
  F: number;
  M: number;
  N: number;
  B: number;
}> {
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
            content: `Evaluate the text on EFMNB dimensions (0-1 scale):
E (Evaluation): Thoroughness of analysis and critical thinking
F (Facts): Factual accuracy and proper citations
M (Meaning): Semantic coherence and logical flow
N (Novelty): Unique insights or creative perspectives
B (Brevity): Conciseness vs unnecessary verbosity (lower is better)

Return only JSON:
{
  "E": 0.X,
  "F": 0.X,
  "M": 0.X,
  "N": 0.X,
  "B": 0.X
}`
          },
          {
            role: 'user',
            content: `Text to evaluate:\n\n${text.substring(0, 1000)}`
          }
        ],
        temperature: 0.1,
        max_tokens: 100,
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const scores = JSON.parse(jsonMatch ? jsonMatch[0] : content);

    return {
      E: Math.max(0, Math.min(1, scores.E || 0.7)),
      F: Math.max(0, Math.min(1, scores.F || 0.7)),
      M: Math.max(0, Math.min(1, scores.M || 0.7)),
      N: Math.max(0, Math.min(1, scores.N || 0.5)),
      B: Math.max(0, Math.min(1, scores.B || 0.3)),
    };
  } catch (error) {
    console.error('Error evaluating EFMNB scores:', error);
    // Default reasonable scores
    return {
      E: 0.7,
      F: 0.7,
      M: 0.7,
      N: 0.5,
      B: 0.3,
    };
  }
}

