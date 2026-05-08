# Development Guide — Moshi Print

> How to set up the development environment and run the project.
> Keep this file updated. If a step is wrong, fix it here and commit.

## Prerequisites

- Node.js 20.x
- npm 10.x
- Docker + Docker Compose
- Git

## Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd moshi-print

# 2. Copy environment file and fill in values
cp .env.example .env

# 3. Install dependencies
npm install

# 4. Start backing services (database, cache, etc.)
docker compose up -d

# 5. Run database migrations
npx prisma migrate dev

# 6. (Optional) Seed the database
npx prisma db seed

# 7. Start the development server
npm run dev
```

## Running Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage
```

## Code Quality

```bash
# Type checking
npm run typecheck
# Linting
npm run lint
```

## Environment Variables

See `.env.example` for all required variables.

| Variable | Required | Description |
|---|---|---|
| TODO | yes | TODO |

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm test` | Run unit tests |
| `npm run test:coverage` | Tests with coverage |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript check |
| `npx prisma migrate dev` | Create and run migration |
| `npx prisma db seed` | Seed database |

## Jira Board

https://github.com/Kreitech/moshi-print/issues

## Tech Lead

Rafael
