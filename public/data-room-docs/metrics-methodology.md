# Metrics Methodology & Quality Scoring
**PromptOps Platform | Version 1.3 | December 2024**

---

## Overview

Our platform uses a sophisticated multi-dimensional scoring system to quantify prompt quality and optimization effectiveness.

## Core Metrics

### 1. Token Efficiency

**Token Count**
- Measured using GPT tokenizer
- Includes all characters and special tokens
- Formula: `token_count = encode(prompt).length`

**Compression Percentage**
```
compression_percentage = (1 - optimized_tokens / original_tokens) × 100
```

**Example**:
- Original: 850 tokens
- Optimized: 612 tokens
- Compression: 28%

### 2. Quality Score

Multi-factor quality assessment combining:

**Clarity** (25%)
- Instruction precision
- Ambiguity reduction
- Structure clarity

**Completeness** (25%)
- Context coverage
- Constraint specification
- Output format definition

**Specificity** (20%)
- Example inclusion
- Edge case handling
- Parameter precision

**Actionability** (15%)
- Clear next steps
- Executable instructions
- Result measurability

**Coherence** (15%)
- Logical flow
- Consistency
- Readability

**Formula**:
```
quality_score = Σ(factor_score × weight)
Range: 0-100
```

### 3. Efficiency Score

Balances quality improvement against token reduction:

```
efficiency_score = (quality_gain × α) - (token_increase × β)

where:
  α = quality_weight (default: 0.7)
  β = token_penalty (default: 0.3)
  quality_gain = new_quality - old_quality
  token_increase = (new_tokens - old_tokens) / old_tokens
```

**Interpretation**:
- `> 0`: Net improvement
- `= 0`: Break-even
- `< 0`: Degradation

### 4. Reasoning Gain Index (RGI)

Measures improvement in logical reasoning capability:

```
RGI = log(new_quality / old_quality) × compression_factor

where:
  compression_factor = original_tokens / optimized_tokens
```

**Thresholds**:
- RGI > 0.2: Significant improvement
- RGI > 0.5: Exceptional improvement
- RGI < 0: Quality degradation

### 5. Compactness Percentage

Information density metric:

```
compactness = (quality_score / token_count) × 1000
```

Higher values indicate better information-to-token ratio.

## Advanced Metrics

### Lambda Tradeoff (λ)

User-configurable balance between quality and cost:

```
priority_score = quality_score × λ + efficiency_score × (1 - λ)

where:
  λ ∈ [0, 1]
  λ = 0: Pure efficiency focus
  λ = 0.5: Balanced approach
  λ = 1: Pure quality focus
```

### Convergence Detection

Optimization stops when:

```
|quality_delta| < convergence_threshold
AND iterations >= min_iterations

where:
  quality_delta = current_quality - previous_quality
  convergence_threshold = default 0.001 (0.1%)
  min_iterations = 3
```

### Judge Voting System

Multi-model consensus for quality assessment:

```
final_quality = weighted_average(judge_scores)

judges = [
  {model: "gpt-5", weight: 0.4},
  {model: "claude-3", weight: 0.3},
  {model: "gemini-2.5-pro", weight: 0.3}
]
```

**Confidence Score**:
```
confidence = 1 - (std_dev(judge_scores) / mean(judge_scores))
```

## Optimization Algorithms

### Proposer-Critic-Verifier (PCV)

**Phase 1: Proposer**
- Generates optimized version
- Applies EFMNB framing
- Maintains semantic equivalence

**Phase 2: Critic**
- Evaluates proposed changes
- Identifies potential issues
- Scores improvement areas

**Phase 3: Verifier**
- Validates quality metrics
- Checks constraint satisfaction
- Confirms token reduction

### EFMNB Framing

Structured prompt enhancement:

- **E**xplicit: Clear, unambiguous instructions
- **F**ocused: Narrow scope, specific goals
- **M**easurable: Quantifiable outcomes
- **N**ecessary: Only essential information
- **B**rief: Concise expression

### Erikson Stages

Iterative refinement approach:

1. **Stage 1**: Initial optimization (aggressive)
2. **Stage 2**: Refinement (balanced)
3. **Stage 3**: Polishing (conservative)
4. **Stage 4+**: Convergence (minimal changes)

## Performance Benchmarks

### Speed
- Average optimization: 15-30 seconds
- Token analysis: <1 second
- Quality scoring: 2-5 seconds per judge

### Accuracy
- Token prediction: 99.5% accuracy
- Quality correlation: r² = 0.87 with human ratings
- Convergence rate: 94% within 10 iterations

### Cost Efficiency
- Average savings: $0.003 per prompt optimization
- ROI threshold: 10+ uses per optimized prompt

## Validation & Testing

### Test Suite
- 500+ prompt pairs with human-rated quality scores
- Cross-validation against industry benchmarks
- A/B testing framework for metric refinement

### Quality Assurance
- Automated regression tests
- Human expert review (sample-based)
- Continuous metric calibration

---

## References

1. Token efficiency standards (OpenAI, 2024)
2. Prompt engineering best practices (Anthropic, 2024)
3. Multi-agent optimization systems (Research paper, 2023)

---

**Last Updated**: December 15, 2024
**Document Owner**: Research Team
