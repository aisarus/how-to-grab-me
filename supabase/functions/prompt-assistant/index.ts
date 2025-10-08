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
    const { messages, useEfmnb = true, useErikson = true } = await req.json();
    
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

    let systemPrompt = `Ты профессиональный ассистент для улучшения промптов. Твоя задача - помогать пользователям создавать более эффективные промпты для AI моделей.

Когда пользователь присылает промпт, ты должен:
1. Проанализировать текущий промпт
2. Определить его слабые места (неясность, недостаток контекста, отсутствие структуры)
3. Предложить улучшенную версию промпта
4. Объяснить, какие именно улучшения были внесены и почему

Принципы хорошего промпта:
- Четкая структура и явные инструкции
- Конкретный формат вывода (если нужен)
- Достаточный контекст для понимания задачи
- Примеры, если это помогает
- Ограничения, чтобы избежать галлюцинаций
- Разбиение сложных задач на подзадачи`;

    // Добавляем фильтры, если они включены
    if (useEfmnb) {
      systemPrompt += `\n\nПрименяй фильтр ЕФМНБ (Emotion, Fact, Metaphor, Negation, Bias):
- Emotion: Добавляй эмоциональный контекст где это уместно
- Fact: Требуй конкретных фактов и данных
- Metaphor: Используй метафоры для ясности
- Negation: Явно указывай, чего НЕ нужно делать
- Bias: Учитывай и минимизируй возможные предубеждения`;
    }

    if (useErikson) {
      systemPrompt += `\n\nПрименяй психологическую модель Эриксона для более глубокого понимания контекста и потребностей пользователя.`;
    }

    systemPrompt += `\n\nОтвечай на русском языке. Будь дружелюбным и конструктивным.`;

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
