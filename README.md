# Finanças

A personal finance manager with an AI layer built in — natural-language transaction entry, automatic recurring/fixed expense tracking, and a chat assistant that reasons over your real numbers instead of guessing them.

Built as a single-page app on React 19 + Vite, backed by Supabase (Postgres, Auth, Realtime), with OpenAI (`gpt-4o-mini`) powering the language features through a Supabase Edge Function — the API key lives only on the server, never in the browser bundle.

## Features

### Smart Input
Type a transaction the way you'd say it out loud — *"paguei 80 de pizza no Nubank"* — and it's parsed into a structured transaction (amount, category, account, date) automatically. The parser also detects recurring language ("todo mês", "assinatura", "mensalidade") and files the entry as a fixed expense on its own.

### Recurring / Fixed Expenses
Register a rent, subscription, or salary once and it keeps appearing every month — projected forward automatically — until you explicitly stop it. History stays intact even after cancellation. Recurrence isn't limited to "same day every month": a fixed entry can instead land on the Nth weekday (e.g. "toda 1ª segunda") or the Nth business day of the month (e.g. "5º dia útil", with Saturday optionally counted as a business day) — common for salaries that don't pay on a fixed calendar date. A dedicated page lets you:
- See every active fixed expense/income with its monthly total and next charge date
- Edit amount, title, category, or billing day without deleting and recreating
- Preview a chronological timeline of upcoming charges across all recurring items

### Calendar
A month grid showing real and projected transactions on the exact day they fall on — including recurring items using the flexible recurrence rules above, so "5º dia útil" always lands on the right date each month. Each day shows income/expense totals and a heat tint scaled to that day's spend; clicking a day opens its full list of transactions with quick pay/receive actions and a shortcut to add a new one dated that day.

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

### Installable App & Push Notifications
Installable as a PWA on desktop and mobile, with an offline-capable precached shell. Opt in from Settings to get a push notification when a fixed expense or installment is due.

### Open Finance (Bank Sync)
Connect a real bank account via Pluggy and let the app pull in accounts and transactions on its own instead of typing them by hand — re-syncable on demand, with imports deduplicated by the provider's transaction id.

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
| PWA / Push | `vite-plugin-pwa` (injectManifest), Web Push + VAPID |
| Open Finance | Pluggy, proxied through a Supabase Edge Function |
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

### Database migrations

SQL files in `supabase/migrations/` add tables beyond the base `accounts`/`transactions` schema (e.g. `goals` for named savings targets, `budgets` for per-category limits, `push_subscriptions` for Web Push, `bank_connections` for Open Finance). Apply them via `npx supabase db push` once linked, or paste them into the Supabase SQL Editor directly — either way, features depending on a migration you haven't run just show an empty state rather than breaking.

### Push notifications (optional)

The app is an installable PWA (manifest + service worker via `vite-plugin-pwa`, `injectManifest` strategy so the worker can also handle push events — see `src/sw.ts`). The "Notificações de contas" toggle in Settings sends a push when a fixed/installment expense is due today. This is the most involved piece to set up — three parts:

1. **Generate a VAPID keypair** (one-time, do this once and reuse it forever):
   ```bash
   npx web-push generate-vapid-keys
   ```
   Put the public key in `.env.local` as `VITE_VAPID_PUBLIC_KEY` (and in Vercel's env vars for prod).

2. **Deploy the sender function and its secrets:**
   ```bash
   npx supabase secrets set VAPID_PUBLIC_KEY=<public> VAPID_PRIVATE_KEY=<private>
   npx supabase functions deploy send-bill-reminders
   ```
   `send-bill-reminders` uses the service role key (already available to every Edge Function as `SUPABASE_SERVICE_ROLE_KEY`) to read across all users — it's protected by requiring that exact key as its own bearer token, so only your cron job can trigger it.

3. **Schedule it to run daily**, via `pg_cron` + `pg_net` (run once in the SQL Editor — adjust the cron time for your timezone; the example below is 08:00 BRT / 11:00 UTC):
   ```sql
   create extension if not exists pg_cron with schema extensions;
   create extension if not exists pg_net with schema extensions;

   select cron.schedule(
     'send-bill-reminders-daily',
     '0 11 * * *',
     $$
     select net.http_post(
       url := 'https://<your-project-ref>.supabase.co/functions/v1/send-bill-reminders',
       headers := jsonb_build_object('Authorization', 'Bearer <your-service-role-key>', 'Content-Type', 'application/json'),
       body := '{}'::jsonb
     );
     $$
   );
   ```

Skipping all three still leaves you with a fully working installable PWA — the notification toggle in Settings just stays off.

### Open Finance (optional)

The "Conectar banco" button in Contas lets a user link a real bank via [Pluggy](https://pluggy.ai) and import its accounts + transactions automatically (re-syncable, dedup'd by the provider's own ids). The Pluggy API credentials never touch the browser — the client only ever gets a short-lived connect token from `pluggy-proxy`.

1. Create a Pluggy account and grab your **Client ID** and **Client Secret** from the dashboard (a sandbox app is free and enough to try the flow end-to-end with test banks).
2. Deploy the proxy function with those as secrets:
   ```bash
   npx supabase secrets set PLUGGY_CLIENT_ID=<client-id> PLUGGY_CLIENT_SECRET=<client-secret>
   npx supabase functions deploy pluggy-proxy
   ```
3. Run migration `0004_bank_connections.sql` (see "Database migrations" above) if you haven't already.

Skipping this leaves "Conectar banco" showing a clear error toast instead of a working flow — nothing else in the app depends on it.

### Run

```bash
npm run dev       # start the dev server
npm run build     # type-check and build for production
npm run preview   # preview the production build locally
npm run test       # run the Vitest suite
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

