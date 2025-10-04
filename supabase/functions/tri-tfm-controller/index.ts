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
    };

    console.log('Starting TRI/TFM controller with config:', tfmConfig);

    let currentText = prompt;
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
      const expandedText = await callDBlock(currentText, LOVABLE_API_KEY);
      const expandedTokens = estimateTokens(expandedText);
      console.log(`After D: ${expandedTokens} tokens`);

      // S Block (Stabilizer) - Reduce and normalize
      console.log('Running S block (stabilization)...');
      const stabilizedText = await callSBlock(expandedText, LOVABLE_API_KEY);
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

async function callDBlock(text: string, apiKey: string): Promise<string> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
          content: `You are the D (Developer) block in a TRI/TFM system. Your role is to:
1. Expand and structure the input text
2. Add missing details and context
3. Improve clarity and completeness
4. Maintain the core message and intent

Keep the expansion moderate - aim for 20-30% more content.`
        },
        {
          role: 'user',
          content: text
        }
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

async function callSBlock(text: string, apiKey: string): Promise<string> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
          content: `You are the S (Stabilizer) block in a TRI/TFM system. Your role is to:
1. Remove redundancy and excessive details
2. Normalize and condense the text
3. Keep only essential information
4. Maintain clarity and coherence

Aim to reduce the text by 30-40% while preserving all key information.`
        },
        {
          role: 'user',
          content: text
        }
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

function estimateTokens(text: string): number {
  // Rough estimation: ~4 chars per token
  return Math.ceil(text.length / 4);
}
