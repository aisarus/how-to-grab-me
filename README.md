# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/7da80b4d-2848-4bee-9ce5-f3eb7b5bd544

## TRI·TFM Technology Overview

This project implements the **TRI·TFM (Triangular Flow Methodology)** prompt optimization system with three core components:

### 1. **D-block (Detailer)** - Expansion Operator
Enriches prompts with context, structure, and detail using EFMNB framing:
- **E** (Emotion): Tone and emotional context
- **F** (Facts): Concrete details and specificity
- **M** (Meaning): Core intent and goals
- **N** (Nuance): Edge cases and constraints
- **B** (Brevity): Conciseness penalty

### 2. **S-block (Summarizer)** - Compression Operator
Distills enriched prompts to essential elements, maximizing token efficiency while preserving semantic value.

### 3. **A-block (Arbiter)** - Automatic Cycle Governor
The Arbiter is a convergence detection and quality control system that eliminates manual cycle termination.

**Role**: Analyzes D↔S iteration results and determines optimal stopping point.

**Does NOT modify content** - only decides when to stop based on:
- Semantic similarity (cosine of embeddings)
- Lexical similarity (normalized Levenshtein)
- Length change (Δlen)
- Style deviation (Δstyle)
- EFMNB quality scores delta (ΔEFMN)

**Decisions**:
- `STOP_ACCEPT` - Converged: result is stable and high-quality
- `STOP_BEST` - Budget exhausted: return best candidate seen
- `ROLLBACK` - Quality degraded: revert to previous best
- `CONTINUE` - Keep iterating: improvements still possible

**Convergence Rule**: Stop when ≥K metrics (default 3 of 5) stabilize for M consecutive iterations (default 2) AND quality gate passes: `min(F,N,M) ≥ threshold - penalty·B`

This ensures TFMController automatically stops when further iterations cease to provide semantic value, preventing infinite loops and wasted compute.

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/7da80b4d-2848-4bee-9ce5-f3eb7b5bd544) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/7da80b4d-2848-4bee-9ce5-f3eb7b5bd544) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
