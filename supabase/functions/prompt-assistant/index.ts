import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, useEfmnb = true, useErikson = true, language = 'en' } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const languageMap: Record<string, string> = {
      'en': 'English',
      'ru': 'Russian',
      'he': 'Hebrew'
    };
    
    const languageName = languageMap[language] || 'English';
    
    let systemPrompt = `You are a professional prompt improvement assistant. Your task is to help users create more effective prompts for AI models.

When a user sends a prompt, you should:
1. Analyze the current prompt
2. Identify its weaknesses (lack of clarity, context, or structure)
3. Suggest an improved version of the prompt
4. Explain what improvements were made and why

Principles of a good prompt:
- Clear structure and explicit instructions
- Specific output format (if needed)
- Sufficient context to understand the task
- Examples, if helpful
- Constraints to avoid hallucinations
- Breaking complex tasks into subtasks`;

    // Add filters if enabled
    if (useEfmnb) {
      systemPrompt += `\n\nApply the EFMNB filter (Emotion, Fact, Metaphor, Negation, Bias):
- Emotion: Add emotional context where appropriate
- Fact: Require specific facts and data
- Metaphor: Use metaphors for clarity
- Negation: Explicitly state what NOT to do
- Bias: Account for and minimize possible biases`;
    }

    if (useErikson) {
      systemPrompt += `\n\nApply Erikson's psychological model for deeper understanding of context and user needs.`;
    }

    systemPrompt += `\n\nRespond in ${languageName}. Be friendly and constructive.`;

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
          ...messages
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Превышен лимит запросов. Пожалуйста, попробуйте позже.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Требуется пополнение баланса. Добавьте средства в workspace Lovable AI.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${errorText}`);
    }

    const data = await response.json();
    const assistantResponse = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ response: assistantResponse }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in prompt-assistant function:', error);
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
