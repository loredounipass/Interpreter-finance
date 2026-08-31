<div align="center">

<img src="./public/apple-icon.png" alt="Interpreter Finance" width="120" />

# Interpreter Finance

**AI-Powered Financial Management Platform for Professional Interpreters**

Track practice minutes, calculate earnings, set performance goals, and gain insights through an AI coach — all from a responsive, mobile-first dashboard.

[![Deploy on Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com)

</div>

---

## Overview

Interpreter Finance is a Progressive Web Application (PWA) built specifically for professional interpreters to manage their practice finances. The platform combines real-time session tracking, earnings projections, and AI-powered coaching into a single, elegant dashboard. With voice dictation support (STT + TTS), interpreters can log sessions hands-free while actively practicing.

---

## Key Features

| Feature | Description |
|---|---|
| **Daily Log** | Record interpretation practice minutes with notes, timestamps, and automatic earnings calculation |
| **Goal Tracking** | Set daily minute targets and monitor qualification streaks across weeks and months |
| **Earnings Dashboard** | Real-time income projections based on hourly rate, work hours, and qualified days |
| **AI Coach** | NVIDIA-powered conversational assistant with streaming responses, Markdown rendering, and TTS playback |
| **Voice Dictation** | Continuous speech-to-text via Web Speech API with auto-send on silence and manual toggle |
| **Text-to-Speech** | NVIDIA Magpie TTS with multiple voices (Diego / Isabela), emotions, and language support |
| **Activity View** | Editable log entries sorted by recency with inline editing for minutes and notes |
| **Insights** | Weekly progress charts, qualification tracking, and cumulative earnings via Recharts |
| **PWA** | Installable on mobile and desktop with offline caching via Workbox service worker |
| **Dark Theme** | Glass-morphism UI with responsive layout, optimized for mobile and desktop |

---

## Tech Stack

### Frontend

<div>

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)
![Lucide](https://img.shields.io/badge/Lucide-000000?style=for-the-badge&logo=lucide&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-31363F?style=for-the-badge&logo=react&logoColor=61DAFB)

</div>

### Backend & Database

<div>

![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

</div>

### AI & Voice

<div>

![NVIDIA](https://img.shields.io/badge/NVIDIA_NIM-76B900?style=for-the-badge&logo=nvidia&logoColor=white)
![NVIDIA NVCF](https://img.shields.io/badge/NVIDIA_NVCF_TTS-76B900?style=for-the-badge&logo=nvidia&logoColor=white)
![Web Speech API](https://img.shields.io/badge/Web_Speech_API-000000?style=for-the-badge&logo=googlechrome&logoColor=white)

</div>

### DevOps & Deployment

<div>

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)

</div>

### Tools & Utilities

<div>

![Markdown](https://img.shields.io/badge/React_Markdown-000000?style=for-the-badge&logo=markdown&logoColor=white)
![Workbox](https://img.shields.io/badge/Workbox-34A853?style=for-the-badge&logo=google&logoColor=white)
![Vercel Analytics](https://img.shields.io/badge/Vercel_Analytics-000000?style=for-the-badge&logo=vercel&logoColor=white)

</div>

---

## Getting Started

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 20+ |
| pnpm | 9+ |
| Supabase Account | [supabase.com](https://supabase.com) |
| NVIDIA API Key | [build.nvidia.com](https://build.nvidia.com) |

### 1. Enable Corepack (for pnpm)

```bash
corepack enable
corepack prepare pnpm@9 --activate
```

### 2. Clone & Install

```bash
git clone https://github.com/your-username/interpreter-finance.git
cd interpreter-finance
pnpm install
```

### 3. Configure Environment

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NVIDIA_API_KEY=nvapi-your-nvidia-api-key
```

### 4. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the development server |
| `pnpm build` | Create a production build (Webpack) |
| `pnpm start` | Run the production server via `node server.js` |

---

## Docker

### Production

```bash
docker compose up app
```

### Development (with hot reload)

```bash
docker compose up dev
```

### Build Manually

```bash
docker build -t interpreter-finance .
docker run -p 3000:3000 interpreter-finance
```

---

## Deployment

The project includes a `render.yaml` blueprint for automatic deployment on [Render](https://render.com).

1. Push your code to GitHub.
2. Connect the repository to Render.
3. The service auto-deploys using the multi-stage Dockerfile.

---

## Project Structure

```
interpreter-finance/
├── app/
│   ├── layout.tsx              # Root layout (theme, favicon, PWA meta)
│   ├── page.tsx                # Entry point (auth gate)
│   ├── globals.css             # Tailwind v4 config + custom styles
│   └── api/
│       ├── chat/
│       │   ├── route.ts        # NVIDIA streaming chat endpoint
│       │   └── sessions/
│       │       ├── route.ts    # List / create sessions
│       │       └── [id]/
│       │           └── route.ts # Update / delete session
│       └── [...path]/
│           └── route.ts        # Supabase API catch-all proxy
├── components/
│   ├── auth/
│   │   └── login-form.tsx      # Login & register forms
│   ├── ai/
│   │   └── ai-chat.tsx         # AI chat interface
│   ├── dashboard/
│   │   ├── dashboard-components.tsx  # All dashboard views
│   │   └── progress-chart.tsx        # Recharts visualization
│   └── ui/
│       └── app-toast.tsx       # Toast notification system
├── hooks/
│   ├── use-auth.ts             # Supabase authentication state
│   ├── use-chat-sessions.ts    # Chat session persistence
│   ├── use-finance.ts          # Finance state + Supabase sync
│   ├── use-speech-to-text.ts   # Web Speech API STT
│   └── use-tts.ts              # NVIDIA Magpie TTS
├── lib/
│   ├── supabase.ts             # Browser Supabase client
│   ├── supabase-server.ts      # Cached server-side client
│   └── finance.ts              # Earnings calculations & goal logic
├── utils/
│   ├── ai-models.ts            # NVIDIA model registry
│   ├── ai-providers.ts         # API key resolver
│   └── ai-system-prompt.ts     # System prompt for AI coach
├── public/
│   ├── icon.svg                # App icon
│   ├── manifest.json           # PWA manifest
│   └── sw.js                   # Service worker (Workbox)
├── Dockerfile                  # Multi-stage production build
├── Dockerfile.dev              # Development build with hot reload
├── docker-compose.yml          # Service orchestration
├── render.yaml                 # Render deployment blueprint
└── next.config.mjs             # Next.js configuration
```

---

## Database Schema

| Table | Description |
|---|---|
| `profiles` | User profiles linked to `auth.users` |
| `goals` | Daily interpretation goals, work hours, rate per minute |
| `daily_logs` | Practice minute logs with notes, active/archived state |
| `chat_sessions` | AI conversation sessions with model selection |
| `chat_messages` | Individual messages within sessions |

All tables enforce **Row Level Security (RLS)** — users can only access their own data.

---

## License

Private project.
