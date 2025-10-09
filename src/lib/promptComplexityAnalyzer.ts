/**
 * Prompt Complexity Analyzer
 * Analyzes prompt characteristics to recommend optimal iteration count
 */

export interface ComplexityScore {
  score: number; // 0-100
  factors: {
    length: number;
    structure: number;
    technicalTerms: number;
    specificity: number;
  };
  recommendedIterations: number;
  confidence: number;
  taskType: 'creative' | 'technical';
  eriksonStage: number; // 1-8
}

/**
 * Estimate token count from text
 */
function estimateTokens(text: string): number {
  // Rough approximation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Analyze structural complexity
 */
function analyzeStructure(text: string): number {
  let score = 0;
  
  // Lists and enumerations
  const listMatches = text.match(/^\d+\.|^-|^•|^\*/gm) || [];
  score += Math.min(listMatches.length * 2, 20);
  
  // Section headers (markdown style)
  const headersMatches = text.match(/^#{1,6}\s/gm) || [];
  score += Math.min(headersMatches.length * 3, 15);
  
  // Bold/emphasis markers
  const emphasisMatches = text.match(/\*\*[^*]+\*\*|__[^_]+__|`[^`]+`/g) || [];
  score += Math.min(emphasisMatches.length, 10);
  
  // Paragraphs
  const paragraphs = text.split(/\n\s*\n/).length;
  score += Math.min(paragraphs * 2, 15);
  
  // Code blocks
  const codeBlocks = (text.match(/```[\s\S]*?```/g) || []).length;
  score += codeBlocks * 5;
  
  return Math.min(score, 100);
}

/**
 * Detect technical terms and domain-specific language
 */
function analyzeTechnicalContent(text: string): number {
  const technicalPatterns = [
    /\b(API|REST|GraphQL|OAuth|JWT|SDK|CLI|CI\/CD|DevOps|microservices?|kubernetes|docker|cloud-native)\b/gi,
    /\b(machine learning|neural network|algorithm|database|encryption|blockchain|cryptocurrency)\b/gi,
    /\b(React|Angular|Vue|Node\.js|Python|Java|TypeScript|JavaScript|SQL|NoSQL)\b/gi,
    /\b(architecture|infrastructure|deployment|scalability|optimization|performance)\b/gi,
    /\b(authentication|authorization|security|compliance|GDPR|encryption)\b/gi,
  ];
  
  let matches = 0;
  technicalPatterns.forEach(pattern => {
    matches += (text.match(pattern) || []).length;
  });
  
  return Math.min((matches / 3) * 10, 100);
}

/**
 * Analyze specificity and detail requirements
 */
function analyzeSpecificity(text: string): number {
  let score = 0;
  
  // Explicit detail requests
  const detailKeywords = [
    'detailed', 'comprehensive', 'step-by-step', 'thorough', 'complete',
    'in-depth', 'elaborate', 'extensive', 'specific', 'precise'
  ];
  
  detailKeywords.forEach(keyword => {
    if (text.toLowerCase().includes(keyword)) {
      score += 10;
    }
  });
  
  // Multiple requirements/phases
  const requirements = text.match(/\brequirement[s]?|phase[s]?|step[s]?|section[s]?|part[s]?\b/gi) || [];
  score += Math.min(requirements.length * 5, 30);
  
  // Examples requested
  if (/\bexample[s]?|instance[s]?|illustration[s]?\b/gi.test(text)) {
    score += 15;
  }
  
  // Multiple output formats
  if (/\b(template|format|structure|framework|model)\b/gi.test(text)) {
    score += 10;
  }
  
  return Math.min(score, 100);
}

/**
 * Determine task type based on content analysis
 */
function analyzeTaskType(text: string): 'creative' | 'technical' {
  const lowerText = text.toLowerCase();
  
  // Creative indicators
  const creativeKeywords = [
    'создай', 'нарисуй', 'придумай', 'сочини', 'напиши историю', 'напиши рассказ',
    'create', 'draw', 'design', 'imagine', 'story', 'narrative', 'art', 'creative',
    'видео', 'изображение', 'картин', 'иллюстрац', 'анимац', 'музык',
    'video', 'image', 'picture', 'illustration', 'animation', 'music',
    'креатив', 'фантаз', 'вообража', 'художеств',
    'fantasy', 'artistic', 'visual', 'graphic'
  ];
  
  // Technical indicators
  const technicalKeywords = [
    'код', 'программ', 'функци', 'алгоритм', 'бизнес', 'аналити', 'расчет', 'формул',
    'code', 'programming', 'function', 'algorithm', 'business', 'analytics', 'calculation', 'formula',
    'api', 'database', 'sql', 'debug', 'optimize', 'refactor', 'implement',
    'typescript', 'javascript', 'python', 'java', 'react', 'компонент',
    'архитектур', 'структур данных', 'оптимизац', 'тестирован',
    'architecture', 'data structure', 'optimization', 'testing',
    'финанс', 'отчет', 'метрик', 'статистик', 'процесс',
    'financial', 'report', 'metrics', 'statistics', 'process'
  ];
  
  let creativeScore = 0;
  let technicalScore = 0;
  
  creativeKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      creativeScore++;
    }
  });
  
  technicalKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      technicalScore++;
    }
  });
  
  return technicalScore > creativeScore ? 'technical' : 'creative';
}

/**
 * Calculate Erikson stage based on task type and complexity
 */
function calculateEriksonStage(taskType: 'creative' | 'technical', complexityScore: number): number {
  if (taskType === 'creative') {
    // Creative tasks: stages 1-4
    // Stage 1: Simple, playful creativity (low complexity)
    // Stage 2: More structured creativity
    // Stage 3: Purpose-driven creativity
    // Stage 4: Skilled, competent creativity (high complexity)
    if (complexityScore < 25) return 1;
    if (complexityScore < 50) return 2;
    if (complexityScore < 75) return 3;
    return 4;
  } else {
    // Technical tasks: stages 5-8
    // Stage 5: Identity/role - establishing solutions
    // Stage 6: Intimacy - integrating systems
    // Stage 7: Generativity - creating value
    // Stage 8: Wisdom - mature, optimal solutions
    if (complexityScore < 25) return 5;
    if (complexityScore < 50) return 6;
    if (complexityScore < 75) return 7;
    return 8;
  }
}

/**
 * Calculate recommended iterations based on complexity
 */
function calculateRecommendedIterations(complexityScore: number, tokenCount: number): number {
  // Base iterations on complexity tiers
  if (complexityScore < 20) return 1; // Simple prompts
  if (complexityScore < 40) return 2; // Moderate complexity
  if (complexityScore < 60) return 3; // High complexity
  if (complexityScore < 80) return 4; // Very high complexity
  return 5; // Extremely complex
}

/**
 * Analyze historical data to improve recommendations
 */
export function analyzeHistoricalPatterns(historicalData: Array<{
  original_tokens: number;
  iterations: number;
  improvement_percentage: number;
  original_prompt: string;
}>): {
  avgIterationsByTokenRange: Map<string, number>;
  successfulConfigs: Array<{ tokens: number; iterations: number; improvement: number }>;
} {
  const tokenRanges = new Map<string, { total: number; count: number }>();
  const successfulConfigs: Array<{ tokens: number; iterations: number; improvement: number }> = [];
  
  historicalData.forEach(entry => {
    const tokens = entry.original_tokens;
    const iterations = entry.iterations;
    const improvement = entry.improvement_percentage;
    
    // Categorize by token ranges
    let range = '0-200';
    if (tokens > 200 && tokens <= 400) range = '200-400';
    else if (tokens > 400 && tokens <= 600) range = '400-600';
    else if (tokens > 600 && tokens <= 800) range = '600-800';
    else if (tokens > 800) range = '800+';
    
    const current = tokenRanges.get(range) || { total: 0, count: 0 };
    tokenRanges.set(range, {
      total: current.total + iterations,
      count: current.count + 1
    });
    
    // Track successful optimizations (positive improvement)
    if (improvement > 0) {
      successfulConfigs.push({
        tokens,
        iterations,
        improvement
      });
    }
  });
  
  // Calculate averages
  const avgIterationsByTokenRange = new Map<string, number>();
  tokenRanges.forEach((value, key) => {
    avgIterationsByTokenRange.set(key, Math.round(value.total / value.count));
  });
  
  return { avgIterationsByTokenRange, successfulConfigs };
}

/**
 * Get token range key
 */
function getTokenRangeKey(tokens: number): string {
  if (tokens <= 200) return '0-200';
  if (tokens <= 400) return '200-400';
  if (tokens <= 600) return '400-600';
  if (tokens <= 800) return '600-800';
  return '800+';
}

/**
 * Main function to analyze prompt complexity and recommend iterations
 */
export function analyzePromptComplexity(
  prompt: string,
  historicalData?: Array<{
    original_tokens: number;
    iterations: number;
    improvement_percentage: number;
    original_prompt: string;
  }>
): ComplexityScore {
  const tokens = estimateTokens(prompt);
  
  // Calculate individual factor scores
  const lengthScore = Math.min((tokens / 10), 100);
  const structureScore = analyzeStructure(prompt);
  const technicalScore = analyzeTechnicalContent(prompt);
  const specificityScore = analyzeSpecificity(prompt);
  
  // Weighted average for overall complexity
  const overallScore = Math.round(
    lengthScore * 0.25 +
    structureScore * 0.25 +
    technicalScore * 0.25 +
    specificityScore * 0.25
  );
  
  // Base recommendation on complexity
  let recommendedIterations = calculateRecommendedIterations(overallScore, tokens);
  let confidence = 0.6; // Default confidence
  
  // Adjust based on historical data if available
  if (historicalData && historicalData.length > 0) {
    const { avgIterationsByTokenRange, successfulConfigs } = analyzeHistoricalPatterns(historicalData);
    const tokenRange = getTokenRangeKey(tokens);
    const historicalAvg = avgIterationsByTokenRange.get(tokenRange);
    
    if (historicalAvg !== undefined) {
      // Blend historical average with complexity-based recommendation
      recommendedIterations = Math.round((recommendedIterations + historicalAvg) / 2);
      confidence = 0.85; // Higher confidence with historical data
      
      // Find similar successful prompts
      const similarSuccessful = successfulConfigs.filter(config => 
        Math.abs(config.tokens - tokens) < 100
      );
      
      if (similarSuccessful.length > 0) {
        // Use median of similar successful configurations
        const sortedIterations = similarSuccessful
          .map(c => c.iterations)
          .sort((a, b) => a - b);
        const medianIterations = sortedIterations[Math.floor(sortedIterations.length / 2)];
        
        // Favor historical success
        recommendedIterations = Math.round((recommendedIterations + medianIterations * 2) / 3);
        confidence = 0.95; // Very high confidence
      }
    }
  }
  
  // Ensure iterations are within reasonable bounds
  recommendedIterations = Math.max(1, Math.min(recommendedIterations, 8));
  
  // Determine task type and Erikson stage
  const taskType = analyzeTaskType(prompt);
  const eriksonStage = calculateEriksonStage(taskType, overallScore);
  
  return {
    score: overallScore,
    factors: {
      length: Math.round(lengthScore),
      structure: Math.round(structureScore),
      specificity: Math.round(specificityScore),
      technicalTerms: Math.round(technicalScore),
    },
    recommendedIterations,
    confidence: Math.round(confidence * 100) / 100,
    taskType,
    eriksonStage,
  };
}
