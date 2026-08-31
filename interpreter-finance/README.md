# Interpreter Finance

AI-powered financial management platform designed for professional interpreters to track, manage, and optimize their practice earnings. Monitor daily interpretation minutes, set performance goals, calculate income projections, and gain actionable insights through an AI coach — all from a responsive, mobile-first dashboard. Built as a Progressive Web App (PWA) with voice dictation (STT + TTS) for hands-free logging during practice sessions.

## Features

- **Daily Log** — Track interpretation practice minutes with notes and goals.
- **Earnings** — Calculate earnings based on daily goals and rate per minute.
- **AI Chat** — Conversational wellness coach powered by NVIDIA NIM models with streaming responses and Markdown rendering.
- **Speech-to-Text** — Continuous voice dictation via Web Speech API (Chrome/Edge) with auto-send on silence.
- **Text-to-Speech** — NVIDIA Magpie TTS with multiple voices and emotions.
- **Activity View** — Editable log entries sorted by recency.
- **Insights** — Weekly progress charts and qualification tracking.
- **PWA** — Installable on mobile and desktop with offline caching via Workbox.
- **Dark Theme** — Glass-morphism UI built with Tailwind CSS v4.

## Tech Stack

| Technology | Purpose | URL |
|---|---|---|
| Next.js 16 | React full-stack framework (App Router, API Routes, standalone mode) | https://nextjs.org |
| React 19 | UI library | https://react.dev |
| TypeScript 5 | Static type checking | https://www.typescriptlang.org |
| Tailwind CSS 4 | Utility-first CSS framework | https://tailwindcss.com |
| Supabase | PostgreSQL database, authentication, realtime subscriptions | https://supabase.com |
| NVIDIA NIM API | LLM inference for AI chat (Nemotron, Mistral, GPT-OSS) | https://build.nvidia.com |
| NVIDIA NVCF TTS | Text-to-speech via Magpie multilingual model | https://build.nvidia.com |
| shadcn/ui | UI component system (base-nova style) | https://ui.shadcn.com |
| Lucide React | Icon library | https://lucide.dev |
| Recharts | Charting library for progress visualization | https://recharts.org |
| react-markdown + remark-gfm | Markdown rendering for AI chat responses | https://github.com/remarkjs/react-markdown |
| Web Speech API | Browser-native speech-to-text (Chrome/Edge) | https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API |
| Workbox | Service worker toolkit for PWA offline caching | https://developer.chrome.com/docs/workbox |
| Docker | Multi-stage container builds (Alpine Linux) | https://www.docker.com |
| Render | Cloud deployment (free tier) | https://render.com |
| pnpm | Fast, disk-efficient package manager | https://pnpm.io |

## Getting Started

### Prerequisites

- **Node.js** 20+
- **pnpm** 9+ (`corepack enable && corepack prepare pnpm@9 --activate`)
- A [Supabase](https://supabase.com) project (database + auth)
- An [NVIDIA API key](https://build.nvidia.com) (for AI chat and TTS)

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NVIDIA_API_KEY=nvapi-your-nvidia-api-key
```

### Install Dependencies

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build & Start

```bash
pnpm build
pnpm start
```

The app runs in standalone mode via `node server.js` on port 3000.

## Docker

### Production

```bash
docker compose up app
```

### Development (with hot reload)

```bash
docker compose up dev
```

### Build manually

```bash
docker build -t interpreter-finance .
docker run -p 3000:3000 interpreter-finance
```

## Deployment (Render)

The project includes a `render.yaml` blueprint. Push to GitHub and connect the repo to [Render](https://render.com). The service auto-deploys using the Dockerfile.

## Project Structure

```
app/
  layout.tsx          # Root layout (theme, favicon, PWA meta)
  page.tsx            # Entry point (auth gate)
  globals.css         # Tailwind v4 config + custom styles
  api/
    chat/route.ts     # NVIDIA streaming chat endpoint
    chat/sessions/    # CRUD for chat sessions
    [...path]/route.ts # Supabase API catch-all proxy
components/
  auth/               # Login and register forms
  ai/                 # AI chat UI
  dashboard/          # Dashboard views (Overview, Daily Log, Goals, etc.)
  ui/                 # Shared UI components (toast, etc.)
hooks/
  use-auth.ts         # Supabase auth state
  use-chat-sessions.ts # Chat session persistence
  use-finance.ts      # Finance state + Supabase sync
  use-speech-to-text.ts # Web Speech API STT
  use-tts.ts          # NVIDIA Magpie TTS
lib/
  supabase.ts         # Browser Supabase client
  supabase-server.ts  # Cached server-side Supabase client
  finance.ts          # Earnings calculations, goal logic
utils/
  ai-models.ts        # NVIDIA model registry
  ai-providers.ts     # API key resolver
  ai-system-prompt.ts # System prompt for AI coach
public/
  icon.svg            # App icon (SVG)
  manifest.json       # PWA manifest
  sw.js               # Service worker (Workbox)
```

## Database Schema (Supabase)

| Table | Description |
|---|---|
| `profiles` | User profiles linked to `auth.users` |
| `goals` | Daily interpretation goals, work hours, rate per minute |
| `daily_logs` | Practice minute logs with notes, active/archived state |
| `chat_sessions` | AI conversation sessions with model selection |
| `chat_messages` | Individual messages within sessions |

All tables have Row Level Security (RLS) policies — users can only access their own data.

## License

Private project.
