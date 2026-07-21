# ScienceFeed

ScienceFeed is a small personal RSS reader for science articles. It lets users sign in with Google, add RSS feeds, define keywords, and keep a simple list of matching articles. It
is built with Bun, TanStack Start, React, Drizzle, SQLite, Better Auth, and Tailwind CSS.

## What it does

- Manage RSS feeds.
- Keep basic settings per user.
- Filter articles by user keywords.
- Mark articles as archived or deleted.
- Run maintenance tasks from a small CLI.

## Requirements

- Bun
- Google OAuth credentials

## Setup

Install dependencies:

```bash
bun install
```

Create a `.env` file:

```bash
VITE_BASE_URL=http://localhost:3000

DATABASE_URL=./instance/site.db

BETTER_AUTH_SECRET=replace-with-a-long-random-string

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Run database migrations:

```bash
bun run dk migrate
```

Seed the bundled RSS feed catalog:

```bash
bun run seed
```

Start the dev server:

```bash
bun run dev
```

The app runs at `http://localhost:3000` by default.

## Useful commands

```bash
bun run lint      # run oxlint
bun run test      # run tests
bun run dev       # start the app locally
bun run build     # build the app and CLI
bun run knip      # check for unused files/dependencies
bun run seed      # seed or update the bundled RSS feed catalog
```

CLI tasks:

```bash
bun run cli seed-rss-feeds
bun run cli fetch-rss-feeds
bun run cli cleanup-deleted-articles
```

## Notes

RSS fetching is handled through the CLI, so run it manually or schedule it with cron/systemd if you want regular updates. Deleted articles are soft-deleted first; the cleanup
command removes old deleted entries and orphaned articles. Custom feeds must use a public HTTP or HTTPS URL. Redirect targets are checked with the same rules.
