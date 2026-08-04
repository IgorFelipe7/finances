# Finanças

A personal finance manager with an AI layer built in — natural-language transaction entry, automatic recurring/fixed expense tracking, and a chat assistant that reasons over your real numbers instead of guessing them.

Built as a single-page app on React 19 + Vite, backed by Supabase (Postgres, Auth, Realtime), with OpenAI (`gpt-4o-mini`) powering the language features through a Supabase Edge Function — the API key lives only on the server, never in the browser bundle.

## Features

### Smart Input
Type a transaction the way you'd say it out loud — *"paguei 80 de pizza no Nubank"* — and it's parsed into a structured transaction (amount, category, account, date) automatically. The parser also detects recurring language ("todo mês", "assinatura", "mensalidade") and files the entry as a fixed expense on its own.

### Recurring / Fixed Expenses
Register a rent, subscription, or salary once and it keeps appearing every month — projected forward automatically — until you explicitly stop it. History stays intact even after cancellation. A dedicated page lets you:
- See every active fixed expense/income with its monthly total and next charge date
- Edit amount, title, category, or billing day without deleting and recreating
- Preview a chronological timeline of upcoming charges across all recurring items

### AI Dashboard Insights
The dashboard computes real financial facts client-side — spending pace vs. income, safe-to-spend-per-day, bills due today or overdue, installments finishing this month — and hands them to an LLM to phrase into short, prioritized, actionable messages. Numbers are never invented by the model; if the AI call fails for any reason, a deterministic fallback generator produces the same messages without it.

### AI Chat Assistant
A persistent chat launcher available from every page, streaming responses token-by-token. Every message is grounded in the same computed financial snapshot (balances, this month's income/expenses, upcoming and overdue bills, ending installments), so answers to "quanto posso gastar hoje?" or "vou estourar o orçamento?" are based on your actual data.

### Accounts & Credit Cards
Track checking, savings, investment, and credit card accounts with running balances. Credit cards support statement closing/due days and an invoice payment flow.

### Transactions
Full CRUD with income/expense/transfer types, installment plans (auto-projected month by month), categories, and per-account filtering. A Time Travel selector lets you view any past or future month.

### Realtime Sync
Changes made on one device propagate to others live via Supabase Realtime subscriptions on `transactions` and `accounts`.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript, built with Vite |
| Styling | Tailwind CSS v4, custom glassmorphism/dark design system |
| Animation | Framer Motion |
| UI primitives | Radix UI (via `radix-ui`), shadcn-style components |
| Data fetching | TanStack Query |
| Forms & validation | React Hook Form + Zod |
| Client state | Zustand |
| Charts | Recharts |
| Backend | Supabase (Postgres, Auth, Realtime, Edge Functions) |
| AI | OpenAI (`gpt-4o-mini`), proxied through a Supabase Edge Function |
| Linting | oxlint |

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project (Postgres schema: `accounts`, `transactions`, both scoped by `user_id` with RLS) with the [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- An [OpenAI](https://platform.openai.com) API key (optional — Smart Input requires it; AI insights and chat gracefully degrade without it)

### Installation

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

### AI setup (one-time)

The OpenAI key is never a client env var — it's a Supabase Edge Function secret, forwarded server-side by `supabase/functions/openai-proxy`. The proxy also requires the caller to be an authenticated user of the app, so the key can't be burned by anonymous traffic.

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase secrets set OPENAI_API_KEY=sk-...
npx supabase functions deploy openai-proxy
```

Without this, every AI feature falls back gracefully (deterministic insights, an error toast on Smart Input/chat) rather than breaking the app.

### Run

```bash
npm run dev       # start the dev server
npm run build     # type-check and build for production
npm run preview   # preview the production build locally
npm run lint       # run oxlint
```

## Deployment

This is a static SPA — [Vercel](https://vercel.com) is the recommended host (zero-config Vite detection, automatic deploys from GitHub, preview URLs per branch). A `vercel.json` is already included, with a catch-all rewrite to `index.html` so client-side routes (React Router) resolve correctly on refresh/deep links. Netlify and Cloudflare Pages work just as well if you prefer those.

1. Import the GitHub repo into Vercel.
2. Add the two environment variables from the table above (Project Settings → Environment Variables).
3. Deploy — the build command and output directory are already configured in `vercel.json`.
4. In your Supabase project, go to **Authentication → URL Configuration** and add your production domain to the Site URL / Redirect URLs, or auth flows will fail.
5. Complete the [AI setup](#ai-setup-one-time) steps above if you haven't — the app works without them, just without AI features.
6. Set a spend limit on your OpenAI account (Billing → Limits) as a safety net — the key is now server-only, but it's still shared across every user of your deployment.

## Project Structure

```
src/
├── components/       # Shared UI primitives, layout (Sidebar, Topbar, AppLayout)
├── config/           # Supabase client setup
├── features/
│   ├── accounts/      # Accounts, credit cards, invoice payments
│   ├── assistant/      # AI chat assistant (store, streaming service, UI)
│   ├── auth/            # Auth store, listener, provider
│   ├── dashboard/       # Metrics, charts, AI insights, financial snapshot engine
│   ├── economia/        # Financial health score, savings tips, AI coach
│   ├── settings/        # UI preferences
│   └── transactions/    # Transactions, Smart Input, recurrence projection engine
├── hooks/             # Cross-cutting hooks (Supabase realtime sync)
├── lib/               # Formatting, date, and AI proxy client utilities
└── routes/            # Page-level route components + router config

supabase/
└── functions/
    ├── _shared/          # CORS helper shared across functions
    └── openai-proxy/     # Server-side OpenAI proxy — the key never reaches the browser
```

## License

Private project — all rights reserved.
