# Technical Architecture Documentation
**PromptOps Platform | Version 1.3 | January 2025**

---

## System Overview

The PromptOps Platform is built on a modern, scalable stack combining React frontend with Supabase backend services.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   UI Layer   │  │  State Mgmt  │  │   Analytics  │      │
│  │  (Shadcn/ui) │  │ (React Query)│  │   (Recharts) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS/WSS
┌─────────────────────────────────────────────────────────────┐
│                   API Layer (Supabase)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Edge Functions│  │  Auth (JWT)  │  │   Realtime   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │    Storage   │  │    Cache     │      │
│  │   (Primary)  │  │  (Documents) │  │   (Redis)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React 18.3+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Shadcn/ui components
- **State Management**: TanStack React Query
- **Routing**: React Router v6
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation

### Backend
- **Platform**: Supabase (PostgreSQL + Edge Functions)
- **Database**: PostgreSQL 15
- **Authentication**: Supabase Auth (JWT-based)
- **Storage**: Supabase Storage (S3-compatible)
- **Realtime**: PostgreSQL pub/sub + WebSockets
- **Functions**: Deno-based Edge Functions

### Key Edge Functions

#### 1. Tri-TFM Controller (`tri-tfm-controller`)
Main optimization engine implementing the Proposer-Critic-Verifier pipeline.

**Endpoint**: `/functions/v1/tri-tfm-controller`

**Input**:
```typescript
{
  original_prompt: string;
  a_parameter: number;
  b_parameter: number;
  max_iterations: number;
  convergence_threshold: number;
  use_efmnb: boolean;
  use_erikson: boolean;
  use_proposer_critic_verifier: boolean;
}
```

**Process**:
1. EFMNB Framing (optional)
2. Erikson Stage Initialization
3. PCV Loop:
   - Proposer: Generate optimized version
   - Critic: Evaluate improvements
   - Verifier: Validate quality metrics
4. Quality recalculation
5. Version history tracking

**Output**:
```typescript
{
  optimization_result_id: string;
  optimized_prompt: string;
  metrics: {
    original_tokens: number;
    optimized_tokens: number;
    compression_percentage: number;
    quality_score: number;
    efficiency_score: number;
  };
  iterations: number;
  convergence: boolean;
}
```

#### 2. Prompt Assistant (`prompt-assistant`)
AI-powered prompt analysis and suggestions.

**Endpoint**: `/functions/v1/prompt-assistant`

**Features**:
- Complexity analysis
- Improvement suggestions
- Template recommendations
- Best practices validation

#### 3. Quality Metrics Recalculation (`recalculate-quality-metrics`)
Background job for updating quality scores.

## Database Schema

### Core Tables

#### `optimization_results`
Stores optimization outcomes and metrics.

**Key Columns**:
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `original_prompt` (text)
- `optimized_prompt` (text)
- `original_tokens` (integer)
- `optimized_tokens` (integer)
- `quality_score` (numeric)
- `efficiency_score` (numeric)
- `iterations` (integer)
- `convergence_threshold` (numeric)
- `created_at` (timestamp)

#### `prompt_versions`
Version history for iterative optimization.

**Key Columns**:
- `id` (UUID, PK)
- `optimization_result_id` (UUID, FK)
- `iteration_number` (integer)
- `prompt_content` (text)
- `content_hash` (text)
- `reviewer_action` (text)

#### `prompt_explanations`
AI-generated explanations for changes.

**Key Columns**:
- `id` (UUID, PK)
- `optimization_result_id` (UUID, FK)
- `iteration_number` (integer)
- `main_issues` (text[])
- `key_transformations` (text[])
- `expected_effects` (text[])
- `full_explanation` (text)

#### `favorite_configs`
User-saved optimization configurations.

#### `shared_results`
Public sharing mechanism with access control.

#### `data_room_documents`
Document management for data room.

### Row-Level Security (RLS)

All tables implement strict RLS policies:
- Users can only access their own data
- Shared results have time-based expiration
- Public shares require valid tokens

## Performance Considerations

### Optimization
- **Code Splitting**: Dynamic imports for routes
- **Lazy Loading**: Components loaded on-demand
- **Asset Optimization**: Image compression, tree-shaking
- **Caching**: React Query with stale-while-revalidate

### Scalability
- **Horizontal Scaling**: Edge functions auto-scale
- **Database**: Connection pooling via Supabase
- **CDN**: Static assets via global CDN
- **Rate Limiting**: Per-user API quotas

### Monitoring
- Real-time error tracking
- Performance metrics collection
- User analytics
- Edge function logs

## Security

### Authentication
- JWT-based authentication
- Secure session management
- Email verification (configurable)
- Password strength requirements

### Data Protection
- Encryption at rest (AES-256)
- TLS 1.3 for data in transit
- RLS for database access control
- CORS protection

### API Security
- Rate limiting per endpoint
- Input validation (Zod schemas)
- SQL injection prevention (parameterized queries)
- XSS protection (React auto-escaping)

## Deployment

### Environments
- **Development**: Local Vite dev server
- **Staging**: Lovable.dev preview
- **Production**: Lovable.dev production domain

### CI/CD
- Automatic deployment on push
- Edge functions deployed independently
- Database migrations applied automatically
- Zero-downtime deployments

---

**Last Updated**: January 13, 2025
**Document Owner**: Engineering Team
