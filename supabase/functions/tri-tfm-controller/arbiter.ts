/**
 * Arbiter Module - Automatic Cycle Governor for TFM Controller
 * 
 * PURPOSE: Automatically determines when D↔S iterations have reached convergence
 * and further changes no longer provide meaningful improvements.
 * 
 * The Arbiter doesn't modify content directly - it analyzes D↔S iteration results
 * and determines the optimal stopping point based on:
 * - Semantic similarity (embeddings cosine)
 * - Lexical similarity (normalized Levenshtein)
 * - Length change (Δlen)
 * - Style deviation (Δstyle)
 * - EFMNB quality scores delta (ΔEFMN)
 * 
 * INPUTS:
 * - prevText, currText: consecutive iteration outputs
 * - scores: {E, F, M, N, B} quality metrics
 * - iteration: current iteration number
 * - mode: "tech" | "creative" (affects thresholds)
 * 
 * OUTPUT:
 * - decision: "CONTINUE" | "STOP_ACCEPT" | "STOP_BEST" | "ROLLBACK"
 * - reason: human-readable explanation
 * - telemetry: detailed metrics for debugging
 * 
 * CONVERGENCE RULE:
 * Stop when ≥K metrics (out of 5) stabilize for M consecutive iterations
 * AND quality gate passes: min(F,N,M) ≥ threshold - penalty·B
 * 
 * GOAL: Eliminate manual cycle termination - TFMController now stops automatically
 * when further iterations cease to provide semantic value.
 */

const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

export interface ArbiterConfig {
  mode: 'tech' | 'creative';
  thresholds: {
    semantic: number;      // τ_sem: косинус эмбеддингов
    lexical: number;       // τ_lex: 1 - normalized Levenshtein
    length: number;        // τ_len: относительное изменение длины
    style: number;         // ε_style: изменение стиля
    efmn: number;          // ε_axes: изменение по осям EFMNB
  };
  qualityGates: {
    minFNM: number;        // минимум для F, N, M
    bPenalty: number;      // коэффициент штрафа за B
  };
  convergence: {
    votesRequired: number; // K из N метрик должны пройти
    patience: number;      // m итераций подряд для гистерезиса
  };
  budget: {
    maxTokens: number;
    maxIterations: number;
  };
}

export interface ArbiterState {
  iteration: number;
  history: IterationSnapshot[];
  bestCandidate: {
    text: string;
    score: number;
    iteration: number;
  };
  convergenceStreak: number;
  oscillationCount: number;
  penalties: {
    D: number; // штраф для Detailer
    S: number; // штраф для Summarizer
  };
}

export interface IterationSnapshot {
  iteration: number;
  text: string;
  metrics: {
    sem: number;
    lex: number;
    dlen: number;
    dstyle: number;
    defmn: number;
  };
  scores: {
    E: number;
    F: number;
    M: number;
    N: number;
    B: number;
  };
  operator: 'D' | 'S';
  tokensUsed: number;
}

export interface ArbiterDecision {
  action: 'CONTINUE' | 'STOP_ACCEPT' | 'STOP_BEST' | 'ROLLBACK';
  reason: string;
  text: string;
  converged: boolean;
  metrics: {
    votes: number;
    convergenceStreak: number;
    qualityGate: boolean;
    oscillationDetected: boolean;
  };
  telemetry: Record<string, any>;
}

/**
 * Получить пресеты порогов в зависимости от режима
 */
export function getDefaultConfig(mode: 'tech' | 'creative'): ArbiterConfig {
  if (mode === 'tech') {
    return {
      mode: 'tech',
      thresholds: {
        semantic: 0.985,
        lexical: 0.98,
        length: 0.03,
        style: 0.05,
        efmn: 0.05,
      },
      qualityGates: {
        minFNM: 0.7,
        bPenalty: 0.3,
      },
      convergence: {
        votesRequired: 3,
        patience: 2,
      },
      budget: {
        maxTokens: 100000,
        maxIterations: 10,
      },
    };
  } else {
    return {
      mode: 'creative',
      thresholds: {
        semantic: 0.97,
        lexical: 0.95,
        length: 0.05,
        style: 0.1,
        efmn: 0.08,
      },
      qualityGates: {
        minFNM: 0.65,
        bPenalty: 0.25,
      },
      convergence: {
        votesRequired: 3,
        patience: 2,
      },
      budget: {
        maxTokens: 100000,
        maxIterations: 10,
      },
    };
  }
}

/**
 * Нормализация текста для сравнения
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:'"]/g, '');
}

/**
 * Вычисление normalized Levenshtein distance
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

function normalizedLevenshtein(a: string, b: string): number {
  const distance = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  return maxLen > 0 ? distance / maxLen : 0;
}

/**
 * Вычисление семантического сходства через эмбеддинги
 */
async function computeSemanticSimilarity(
  text1: string,
  text2: string,
  apiKey: string
): Promise<number> {
  try {
    // Используем AI Gateway для получения эмбеддингов
    const response = await fetch(AI_GATEWAY_URL, {
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
            content: 'Compare the semantic similarity of two texts and return a score from 0 to 1, where 1 means identical meaning and 0 means completely different. Return only the number.'
          },
          {
            role: 'user',
            content: `Text 1: "${text1.substring(0, 500)}"\n\nText 2: "${text2.substring(0, 500)}"\n\nSemantic similarity score (0-1):`
          }
        ],
        temperature: 0.1,
        max_tokens: 10,
      }),
    });

    const data = await response.json();
    const score = parseFloat(data.choices[0].message.content.trim());
    return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
  } catch (error) {
    console.error('Error computing semantic similarity:', error);
    // Fallback к лексической метрике
    return 1 - normalizedLevenshtein(normalizeText(text1), normalizeText(text2));
  }
}

/**
 * Вычисление изменения стиля (упрощённая метрика)
 */
function computeStyleDelta(text1: string, text2: string): number {
  const avgSentenceLength = (text: string) => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return 0;
    return text.length / sentences.length;
  };

  const lexicalDiversity = (text: string) => {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const unique = new Set(words);
    return words.length > 0 ? unique.size / words.length : 0;
  };

  const len1 = avgSentenceLength(text1);
  const len2 = avgSentenceLength(text2);
  const div1 = lexicalDiversity(text1);
  const div2 = lexicalDiversity(text2);

  const lenDelta = len1 > 0 ? Math.abs(len2 - len1) / len1 : 0;
  const divDelta = Math.abs(div2 - div1);

  return (lenDelta + divDelta) / 2;
}

/**
 * Вычисление изменения по осям EFMNB
 */
function computeEFMNDelta(
  scores1: IterationSnapshot['scores'],
  scores2: IterationSnapshot['scores']
): number {
  const delta = Math.sqrt(
    Math.pow(scores2.E - scores1.E, 2) +
    Math.pow(scores2.F - scores1.F, 2) +
    Math.pow(scores2.M - scores1.M, 2) +
    Math.pow(scores2.N - scores1.N, 2) +
    Math.pow(scores2.B - scores1.B, 2)
  ) / Math.sqrt(5);

  return delta;
}

/**
 * Проверка гейта качества
 */
function checkQualityGate(
  scores: IterationSnapshot['scores'],
  config: ArbiterConfig
): boolean {
  const { minFNM, bPenalty } = config.qualityGates;
  const threshold = minFNM - bPenalty * scores.B;
  
  return scores.F >= threshold && 
         scores.N >= threshold && 
         scores.M >= threshold;
}

/**
 * Детекция осцилляций в истории
 */
function detectOscillation(history: IterationSnapshot[]): boolean {
  if (history.length < 4) return false;

  const recent = history.slice(-4);
  const texts = recent.map(h => normalizeText(h.text));
  
  // Проверяем паттерн A -> B -> A -> B
  if (texts.length === 4) {
    const sim01 = 1 - normalizedLevenshtein(texts[0], texts[1]);
    const sim12 = 1 - normalizedLevenshtein(texts[1], texts[2]);
    const sim23 = 1 - normalizedLevenshtein(texts[2], texts[3]);
    const sim02 = 1 - normalizedLevenshtein(texts[0], texts[2]);
    const sim13 = 1 - normalizedLevenshtein(texts[1], texts[3]);

    // Если чередуются похожие версии
    return sim02 > 0.9 && sim13 > 0.9 && sim01 < 0.8 && sim12 < 0.8 && sim23 < 0.8;
  }

  return false;
}

/**
 * Основная функция Арбитра - принятие решения
 */
export async function arbiter(
  prevSnapshot: IterationSnapshot | null,
  currSnapshot: IterationSnapshot,
  state: ArbiterState,
  config: ArbiterConfig,
  apiKey: string
): Promise<ArbiterDecision> {
  // Обновляем историю
  state.history.push(currSnapshot);
  state.iteration = currSnapshot.iteration;

  // Проверка бюджета
  const totalTokens = state.history.reduce((sum, h) => sum + h.tokensUsed, 0);
  if (totalTokens >= config.budget.maxTokens || 
      state.iteration >= config.budget.maxIterations) {
    return {
      action: 'STOP_BEST',
      reason: 'Budget exhausted - returning best candidate',
      text: state.bestCandidate.text,
      converged: false,
      metrics: {
        votes: 0,
        convergenceStreak: state.convergenceStreak,
        qualityGate: false,
        oscillationDetected: false,
      },
      telemetry: {
        totalTokens,
        bestIteration: state.bestCandidate.iteration,
        bestScore: state.bestCandidate.score,
      },
    };
  }

  // Если нет предыдущего снапшота, продолжаем
  if (!prevSnapshot) {
    // Обновляем best candidate
    const score = (currSnapshot.scores.F + currSnapshot.scores.N + currSnapshot.scores.M) / 3;
    if (score > state.bestCandidate.score) {
      state.bestCandidate = {
        text: currSnapshot.text,
        score,
        iteration: currSnapshot.iteration,
      };
    }

    return {
      action: 'CONTINUE',
      reason: 'First iteration - no comparison available',
      text: currSnapshot.text,
      converged: false,
      metrics: {
        votes: 0,
        convergenceStreak: 0,
        qualityGate: checkQualityGate(currSnapshot.scores, config),
        oscillationDetected: false,
      },
      telemetry: {
        iteration: state.iteration,
        score,
      },
    };
  }

  // Нормализация текстов
  const prevNorm = normalizeText(prevSnapshot.text);
  const currNorm = normalizeText(currSnapshot.text);

  // Вычисление метрик
  const sem = await computeSemanticSimilarity(prevSnapshot.text, currSnapshot.text, apiKey);
  const lex = 1 - normalizedLevenshtein(prevNorm, currNorm);
  const dlen = prevSnapshot.text.length > 0 
    ? Math.abs(currSnapshot.text.length - prevSnapshot.text.length) / prevSnapshot.text.length 
    : 0;
  const dstyle = computeStyleDelta(prevSnapshot.text, currSnapshot.text);
  const defmn = computeEFMNDelta(prevSnapshot.scores, currSnapshot.scores);

  // Сохраняем метрики
  currSnapshot.metrics = { sem, lex, dlen, dstyle, defmn };

  // Голосование по метрикам
  let votes = 0;
  if (sem >= config.thresholds.semantic) votes++;
  if (lex >= config.thresholds.lexical) votes++;
  if (dlen <= config.thresholds.length) votes++;
  if (dstyle <= config.thresholds.style) votes++;
  if (defmn <= config.thresholds.efmn) votes++;

  const converged = votes >= config.convergence.votesRequired;

  // Обновляем streak
  if (converged) {
    state.convergenceStreak++;
  } else {
    state.convergenceStreak = 0;
  }

  // Проверка качества
  const gateOk = checkQualityGate(currSnapshot.scores, config);

  // Детекция осцилляций
  const oscillation = detectOscillation(state.history);
  if (oscillation) {
    state.oscillationCount++;
  }

  // Обновляем best candidate
  const score = (currSnapshot.scores.F + currSnapshot.scores.N + currSnapshot.scores.M) / 3;
  if (score > state.bestCandidate.score && gateOk) {
    state.bestCandidate = {
      text: currSnapshot.text,
      score,
      iteration: currSnapshot.iteration,
    };
  }

  // Телеметрия
  const telemetry = {
    iteration: state.iteration,
    votes,
    sem,
    lex,
    dlen,
    dstyle,
    defmn,
    scores: currSnapshot.scores,
    gateOk,
    oscillation,
    convergenceStreak: state.convergenceStreak,
    operator: currSnapshot.operator,
  };

  // Если гейт качества не пройден - rollback
  if (!gateOk) {
    // Штрафуем оператора
    state.penalties[currSnapshot.operator] += 0.05;
    
    return {
      action: 'ROLLBACK',
      reason: `Quality gate failed - F:${currSnapshot.scores.F.toFixed(2)}, N:${currSnapshot.scores.N.toFixed(2)}, M:${currSnapshot.scores.M.toFixed(2)}`,
      text: state.bestCandidate.text,
      converged: false,
      metrics: {
        votes,
        convergenceStreak: state.convergenceStreak,
        qualityGate: false,
        oscillationDetected: oscillation,
      },
      telemetry,
    };
  }

  // Если достигнут patience - останавливаемся
  if (state.convergenceStreak >= config.convergence.patience) {
    return {
      action: 'STOP_ACCEPT',
      reason: `Converged - ${votes}/${config.convergence.votesRequired} metrics passed for ${state.convergenceStreak} iterations`,
      text: currSnapshot.text,
      converged: true,
      metrics: {
        votes,
        convergenceStreak: state.convergenceStreak,
        qualityGate: true,
        oscillationDetected: oscillation,
      },
      telemetry,
    };
  }

  // Если детектирована осцилляция - применяем демпфирование
  if (oscillation && state.oscillationCount >= 2) {
    return {
      action: 'STOP_BEST',
      reason: 'Oscillation detected - returning best candidate',
      text: state.bestCandidate.text,
      converged: false,
      metrics: {
        votes,
        convergenceStreak: state.convergenceStreak,
        qualityGate: true,
        oscillationDetected: true,
      },
      telemetry: {
        ...telemetry,
        oscillationCount: state.oscillationCount,
      },
    };
  }

  // Продолжаем итерации
  return {
    action: 'CONTINUE',
    reason: `Converging - ${votes}/${config.convergence.votesRequired} metrics, streak ${state.convergenceStreak}/${config.convergence.patience}`,
    text: currSnapshot.text,
    converged: false,
    metrics: {
      votes,
      convergenceStreak: state.convergenceStreak,
      qualityGate: true,
      oscillationDetected: oscillation,
    },
    telemetry,
  };
}

/**
 * Инициализация состояния Арбитра
 */
export function initArbiterState(): ArbiterState {
  return {
    iteration: 0,
    history: [],
    bestCandidate: {
      text: '',
      score: 0,
      iteration: 0,
    },
    convergenceStreak: 0,
    oscillationCount: 0,
    penalties: {
      D: 0,
      S: 0,
    },
  };
}
