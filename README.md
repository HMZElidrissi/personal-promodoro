# Personal Promodoro

A personal Pomodoro timer app built with React Router. Track focus sessions, short/long breaks, distractions, and todos—all in one place.

## Features

- **Pomodoro timer** — Focus, short break, and long break modes with configurable durations (default 25 / 5 / 15 min)
- **Session tracking** — Log focus topics and view session history
- **Distractions** — Note distractions during focus and mark them resolved
- **Todo list** — Inline task list tied to your workflow
- **Contribution-style graph** — Visualize your focus activity over time
- **Persistent state** — Data stored locally so it survives refreshes
- **Deploy anywhere** — Runs on Cloudflare Workers (included) or any Node/static host

## Tech Stack

- [React Router](https://reactrouter.com/) v7 (SSR, data loading)
- React 19, TypeScript
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Radix UI](https://www.radix-ui.com/) + custom components (e.g. circular progress)
- [date-fns](https://date-fns.org/) for dates
- [Lucide React](https://lucide-react.dev/) for icons

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm)

### Installation

```bash
pnpm install
```

### Development

Start the dev server with HMR:

```bash
pnpm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Other scripts

| Command           | Description                          |
|-------------------|--------------------------------------|
| `pnpm run build`  | Production build                     |
| `pnpm run preview`| Preview production build locally     |
| `pnpm run deploy` | Build and deploy to Cloudflare       |
| `pnpm run typecheck` | Type-check and generate types   |
| `pnpm run format` | Format code with Prettier             |

## Deployment (Cloudflare Workers)

The app is set up to deploy with [Wrangler](https://developers.cloudflare.com/workers/wrangler/).

Deploy to production:

```bash
pnpm run deploy
```

Preview deployment (upload a version, then promote after verification):

```bash
pnpm run build
npx wrangler versions upload
npx wrangler versions deploy
```

## Project structure (high level)

- `app/routes/` — Home (timer), History, Distractions
- `app/components/` — Layout, timer UI, contribution graph, shadcn-style components
- `app/lib/` — Timer context/hooks, storage helpers, types, sounds, utils

---

Built with React Router and Tailwind.
