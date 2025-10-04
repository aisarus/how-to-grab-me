import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TFMConfig {
  a: number; // D expansion rate
  b: number; // S reduction rate
  I: number; // Injection term
  R: number; // Irreducible core
  maxIterations: number;
  convergenceThreshold: number;
  useEFMNB: boolean; // Enable EFMNB framing in D block
  eriksonStage?: number; // 1-8, Erikson's psychosocial stage filter for S block
  autoImprovePrompt: boolean; // Enable Proposer-Critic-Verifier for prompt improvement
}

interface TFMResponse {
  finalText: string;
  iterations: number;
  tokenHistory: number[];
  converged: boolean;
  savings: {
    initialTokens: number;
    finalTokens: number;
    reductionPercent: number;
  };
  promptImprovement?: {
    originalPrompt: string;
    improvedPrompt: string;
    improvements: string[];
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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Default TFM configuration
    const tfmConfig: TFMConfig = {
      a: config?.a ?? 0.20,
      b: config?.b ?? 0.35,
      I: config?.I ?? 50,
      R: config?.R ?? 100,
      maxIterations: config?.maxIterations ?? 4,
      convergenceThreshold: config?.convergenceThreshold ?? 0.05,
      useEFMNB: config?.useEFMNB ?? true,
      eriksonStage: config?.eriksonStage,
      autoImprovePrompt: config?.autoImprovePrompt ?? true,
    };

    console.log('Starting TRI/TFM controller with config:', tfmConfig);

    // Proposer-Critic-Verifier: Auto-improve prompt before main loop
    let promptImprovement = undefined;
    let workingPrompt = prompt;
    
    if (tfmConfig.autoImprovePrompt) {
      console.log('\n=== Proposer-Critic-Verifier: Improving prompt ===');
      const improved = await improvePrompt(prompt, LOVABLE_API_KEY);
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

    const initialTokens = currentTokens;

    while (iteration < tfmConfig.maxIterations) {
      iteration++;
      console.log(`\n=== Iteration ${iteration} ===`);
      console.log(`Current tokens: ${currentTokens}`);

      // D Block (Developer/Draft) - Expand and structure
      console.log('Running D block (expansion)...');
      const expandedText = await callDBlock(currentText, LOVABLE_API_KEY, tfmConfig.useEFMNB);
      const expandedTokens = estimateTokens(expandedText);
      console.log(`After D: ${expandedTokens} tokens`);

      // S Block (Stabilizer) - Reduce and normalize
      console.log('Running S block (stabilization)...');
      const stabilizedText = await callSBlock(expandedText, LOVABLE_API_KEY, tfmConfig.eriksonStage);
      const stabilizedTokens = estimateTokens(stabilizedText);
      console.log(`After S: ${stabilizedTokens} tokens`);

      tokenHistory.push(stabilizedTokens);

      // Check convergence
      const delta = Math.abs(stabilizedTokens - currentTokens);
      const relativeDelta = delta / currentTokens;
      
      console.log(`Delta: ${delta}, Relative: ${relativeDelta.toFixed(4)}`);

      if (relativeDelta < tfmConfig.convergenceThreshold) {
        console.log('Converged!');
        converged = true;
        currentText = stabilizedText;
        currentTokens = stabilizedTokens;
        break;
      }

      currentText = stabilizedText;
      currentTokens = stabilizedTokens;
    }

    const finalTokens = currentTokens;
    const reductionPercent = ((initialTokens - finalTokens) / initialTokens) * 100;

    const response: TFMResponse = {
      finalText: currentText,
      iterations: iteration,
      tokenHistory,
      converged,
      savings: {
        initialTokens,
        finalTokens,
        reductionPercent: Math.round(reductionPercent * 100) / 100,
      },
      promptImprovement,
    };

    console.log('\n=== Final Results ===');
    console.log(`Iterations: ${iteration}`);
    console.log(`Initial tokens: ${initialTokens}`);
    console.log(`Final tokens: ${finalTokens}`);
    console.log(`Reduction: ${reductionPercent.toFixed(2)}%`);

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

async function callDBlock(text: string, apiKey: string, useEFMNB: boolean): Promise<string> {
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

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`D Block failed: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callSBlock(text: string, apiKey: string, eriksonStage?: number): Promise<string> {
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

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`S Block failed: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function improvePrompt(
  prompt: string, 
  apiKey: string
): Promise<{ originalPrompt: string; improvedPrompt: string; improvements: string[] }> {
  
  // Step 1: Proposer - Generate improved versions
  const proposerResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
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
      temperature: 0.6,
    }),
  });

  if (!proposerResponse.ok) {
    throw new Error(`Proposer failed: ${await proposerResponse.text()}`);
  }

  const proposerData = await proposerResponse.json();
  const proposerOutput = proposerData.choices[0].message.content;
  
  // Parse JSON from proposer
  let parsed;
  try {
    const jsonMatch = proposerOutput.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : proposerOutput);
  } catch {
    // Fallback if JSON parsing fails
    return {
      originalPrompt: prompt,
      improvedPrompt: prompt,
      improvements: ['Failed to improve prompt - using original'],
    };
  }

  // Step 2: Critic - Evaluate the improvement
  const criticResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
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
      temperature: 0.3,
    }),
  });

  const criticData = await criticResponse.json();
  const criticOutput = criticData.choices[0].message.content;
  
  let criticResult;
  try {
    const jsonMatch = criticOutput.match(/\{[\s\S]*\}/);
    criticResult = JSON.parse(jsonMatch ? jsonMatch[0] : criticOutput);
  } catch {
    criticResult = { approved: true, score: 70 }; // Default approve if parsing fails
  }

  console.log('Critic evaluation:', criticResult);

  // If approved or score >= 60, use improved prompt
  if (criticResult.approved || criticResult.score >= 60) {
    return {
      originalPrompt: prompt,
      improvedPrompt: parsed.improvedPrompt,
      improvements: parsed.improvements || ['Prompt optimized for better LLM response'],
    };
  }

  // Otherwise return original
  return {
    originalPrompt: prompt,
    improvedPrompt: prompt,
    improvements: ['No improvement needed - original prompt is good'],
  };
}

function estimateTokens(text: string): number {
  // Rough estimation: ~4 chars per token
  return Math.ceil(text.length / 4);
}
