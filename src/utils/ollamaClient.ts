interface OllamaResponse {
  response: string;
  done: boolean;
}

interface TFMConfig {
  a: number;
  b: number;
  maxIterations: number;
  convergenceThreshold: number;
  useEFMNB: boolean;
  eriksonStage?: number;
  autoImprovePrompt: boolean;
}

interface TFMResult {
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

export class OllamaClient {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'llama2') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    const fullPrompt = systemPrompt 
      ? `${systemPrompt}\n\nUser: ${prompt}\n\nAssistant:`
      : prompt;

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        prompt: fullPrompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data: OllamaResponse = await response.json();
    return data.response;
  }

  async improvePrompt(prompt: string): Promise<{
    originalPrompt: string;
    improvedPrompt: string;
    improvements: string[];
  }> {
    const proposerPrompt = `You are an AI prompt engineer. Your task is to improve the following prompt by:
1. Adding explicit structure (e.g., "First... Then... Finally...")
2. Specifying desired output format
3. Clarifying the intent and reducing ambiguity
4. Adding helpful constraints

Original prompt: "${prompt}"

Provide an improved version of this prompt that is clearer, more structured, and more likely to produce good results.
Return ONLY the improved prompt, nothing else.`;

    const improvedPrompt = await this.generate(proposerPrompt);

    const criticPrompt = `Evaluate if this improved prompt is better than the original.

Original: "${prompt}"
Improved: "${improvedPrompt}"

Return a JSON object with:
- approved: boolean (true if improved is better)
- score: number (0-100)
- reasoning: string (explanation)

Return ONLY valid JSON, nothing else.`;

    const criticResponse = await this.generate(criticPrompt);
    
    let evaluation;
    try {
      const jsonMatch = criticResponse.match(/\{[\s\S]*\}/);
      evaluation = jsonMatch ? JSON.parse(jsonMatch[0]) : { approved: true, score: 80 };
    } catch {
      evaluation = { approved: true, score: 80 };
    }

    const improvements = [
      "Added explicit structure",
      "Specified desired output format",
      "Clarified intent and reduced ambiguity"
    ];

    return {
      originalPrompt: prompt,
      improvedPrompt: evaluation.approved ? improvedPrompt.trim() : prompt,
      improvements,
    };
  }

  async callDBlock(text: string, useEFMNB: boolean): Promise<string> {
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
- Expand the text by adding structure and details
- Clarify ambiguities
- Add context where needed
- Maintain logical consistency
- Expand by approximately 20-30%`;

    return await this.generate(text, systemPrompt);
  }

  async callSBlock(text: string, eriksonStage?: number): Promise<string> {
    let systemPrompt = `You are the S (Stabilizer) block in a TRI/TFM system. Your role is to:
- Condense the text while preserving core meaning
- Remove redundancy
- Normalize structure
- Reduce by approximately 30-35%
- Keep only essential information`;

    if (eriksonStage) {
      const stages: Record<number, { name: string; virtue: string; focus: string }> = {
        1: { name: 'Trust vs. Mistrust', virtue: 'Hope', focus: 'Basic safety and reliability' },
        2: { name: 'Autonomy vs. Shame', virtue: 'Will', focus: 'Independence and self-control' },
        3: { name: 'Initiative vs. Guilt', virtue: 'Purpose', focus: 'Taking initiative and planning' },
        4: { name: 'Industry vs. Inferiority', virtue: 'Competence', focus: 'Mastery and productivity' },
        5: { name: 'Identity vs. Role Confusion', virtue: 'Fidelity', focus: 'Identity formation and values' },
        6: { name: 'Intimacy vs. Isolation', virtue: 'Love', focus: 'Deep relationships and commitment' },
        7: { name: 'Generativity vs. Stagnation', virtue: 'Care', focus: 'Contribution and legacy' },
        8: { name: 'Integrity vs. Despair', virtue: 'Wisdom', focus: 'Life reflection and acceptance' },
      };
      
      const stage = stages[eriksonStage];
      if (stage) {
        systemPrompt += `\n\nApply Erikson's "${stage.name}" lens (${stage.virtue}): ${stage.focus}`;
      }
    }

    return await this.generate(text, systemPrompt);
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.split(/\s+/).length * 1.3);
  }

  async runTFM(prompt: string, config: TFMConfig): Promise<TFMResult> {
    let promptImprovement;
    let workingPrompt = prompt;

    if (config.autoImprovePrompt) {
      promptImprovement = await this.improvePrompt(prompt);
      workingPrompt = promptImprovement.improvedPrompt;
    }

    let currentText = workingPrompt;
    let currentTokens = this.estimateTokens(currentText);
    const tokenHistory: number[] = [currentTokens];
    let iteration = 0;
    let converged = false;

    const initialTokens = currentTokens;

    while (iteration < config.maxIterations) {
      iteration++;

      const expandedText = await this.callDBlock(currentText, config.useEFMNB);
      const expandedTokens = this.estimateTokens(expandedText);

      const stabilizedText = await this.callSBlock(expandedText, config.eriksonStage);
      const stabilizedTokens = this.estimateTokens(stabilizedText);

      tokenHistory.push(stabilizedTokens);

      const delta = Math.abs(stabilizedTokens - currentTokens);
      const relativeDelta = delta / currentTokens;

      if (relativeDelta < config.convergenceThreshold) {
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

    return {
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
  }
}
