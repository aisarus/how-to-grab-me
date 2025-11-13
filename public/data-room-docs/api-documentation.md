# API Documentation
**PromptOps Platform | Version 1.1 | January 2025**

---

## Base URL

```
Production: https://[project-id].supabase.co/functions/v1
Development: http://localhost:54321/functions/v1
```

## Authentication

All API requests require authentication via JWT token.

### Headers
```http
Authorization: Bearer <supabase_jwt_token>
Content-Type: application/json
```

### Getting a Token

```javascript
import { supabase } from '@/integrations/supabase/client';

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure_password'
});

// Token available at: data.session.access_token
```

---

## Endpoints

### 1. Optimize Prompt

**POST** `/tri-tfm-controller`

Optimize a prompt using the Tri-Module Framework.

**Request Body**:
```json
{
  "original_prompt": "Write a function to sort an array",
  "a_parameter": 0.7,
  "b_parameter": 0.3,
  "max_iterations": 5,
  "convergence_threshold": 0.001,
  "use_efmnb": true,
  "use_erikson": true,
  "use_proposer_critic_verifier": true
}
```

**Response** (200 OK):
```json
{
  "optimization_result_id": "550e8400-e29b-41d4-a716-446655440000",
  "optimized_prompt": "Create a JavaScript function that...",
  "metrics": {
    "original_tokens": 850,
    "optimized_tokens": 612,
    "compression_percentage": 28.0,
    "quality_score": 87.5,
    "efficiency_score": 92.3,
    "reasoning_gain_index": 0.42
  },
  "iterations": 4,
  "converged": true,
  "tta_sec": 23.4,
  "cost_cents": 0.15
}
```

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `original_prompt` | string | Yes | - | The prompt to optimize |
| `a_parameter` | number | No | 0.7 | Quality weight (0-1) |
| `b_parameter` | number | No | 0.3 | Token penalty weight (0-1) |
| `max_iterations` | integer | No | 10 | Maximum optimization iterations |
| `convergence_threshold` | number | No | 0.001 | Quality change threshold for convergence |
| `use_efmnb` | boolean | No | true | Apply EFMNB framing |
| `use_erikson` | boolean | No | true | Use Erikson stages |
| `use_proposer_critic_verifier` | boolean | No | true | Enable PCV pipeline |

**Error Responses**:

- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Missing or invalid token
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Optimization failed

---

### 2. Get Optimization Result

**GET** `/optimization-results/{id}`

Retrieve details of a previous optimization.

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2025-01-13T10:30:00Z",
  "original_prompt": "...",
  "optimized_prompt": "...",
  "metrics": { ... },
  "iterations": 4,
  "convergence_threshold": 0.001,
  "versions": [
    {
      "iteration_number": 1,
      "prompt_content": "...",
      "content_hash": "abc123"
    }
  ]
}
```

---

### 3. Prompt Assistant

**POST** `/prompt-assistant`

Get AI-powered suggestions for prompt improvement.

**Request Body**:
```json
{
  "prompt": "Write a function to sort an array",
  "analysis_type": "comprehensive"
}
```

**Response** (200 OK):
```json
{
  "complexity": {
    "score": 45,
    "level": "medium",
    "factors": {
      "length": 12,
      "ambiguity": 0.6,
      "specificity": 0.4
    }
  },
  "suggestions": [
    {
      "category": "clarity",
      "priority": "high",
      "description": "Specify the programming language",
      "example": "Write a JavaScript function..."
    }
  ],
  "templates": [
    {
      "name": "Code Generation",
      "match_score": 0.85,
      "template": "Create a [language] function that..."
    }
  ]
}
```

---

### 4. Recalculate Quality Metrics

**POST** `/recalculate-quality-metrics`

Trigger background recalculation of quality scores.

**Request Body**:
```json
{
  "optimization_result_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response** (202 Accepted):
```json
{
  "status": "queued",
  "job_id": "job_123456",
  "estimated_completion": "2025-01-13T10:35:00Z"
}
```

---

## Database API (Supabase Client)

### Query Optimizations

```javascript
// Get user's optimization history
const { data, error } = await supabase
  .from('optimization_results')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(20);

// Get version history
const { data: versions } = await supabase
  .from('prompt_versions')
  .select('*')
  .eq('optimization_result_id', resultId)
  .order('iteration_number', { ascending: true });

// Get explanations
const { data: explanations } = await supabase
  .from('prompt_explanations')
  .select('*')
  .eq('optimization_result_id', resultId);
```

### Real-time Subscriptions

```javascript
// Subscribe to optimization updates
const channel = supabase
  .channel('optimizations')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'optimization_results',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('New optimization:', payload.new);
    }
  )
  .subscribe();
```

---

## Rate Limits

| Tier | Requests/Hour | Tokens/Day | Concurrent |
|------|---------------|------------|------------|
| Free | 10 | 50,000 | 1 |
| Starter | 100 | 500,000 | 3 |
| Professional | 1,000 | 5,000,000 | 10 |
| Enterprise | Unlimited | Unlimited | 50 |

---

## Error Codes

| Code | Message | Resolution |
|------|---------|------------|
| `INVALID_PROMPT` | Prompt is empty or too long | Provide valid prompt (1-10000 chars) |
| `INVALID_PARAMETERS` | Parameter out of range | Check parameter constraints |
| `AUTH_REQUIRED` | Authentication missing | Include valid JWT token |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry, or upgrade plan |
| `OPTIMIZATION_FAILED` | Optimization error | Contact support with request ID |

---

## SDKs & Client Libraries

### JavaScript/TypeScript
```bash
npm install @supabase/supabase-js
```

### Python (Coming Soon)
```bash
pip install promptops-sdk
```

---

## Webhooks (Beta)

Subscribe to events:
- `optimization.completed`
- `optimization.failed`
- `quality.recalculated`

**Configuration**: Available in user settings

---

**Support**: api-support@promptops.com
**Status Page**: https://status.promptops.com
