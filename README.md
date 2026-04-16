# Cutting Meal Macro Tracker

A local-first meal tracking app for cutting that uses a meal photo plus a short description to estimate macros, save the meal with its photo, and compare each day against your saved targets.

## What This Version Includes

- Meal analysis from photo + short text description
- Structured macro estimate with confidence and assumptions
- Editable review step before saving
- Stored meal photos
- Daily log with edit and delete support
- Saved custom targets in the database
- Date navigation for past days
- Seven-day history and weekly trend summary
- SQLite storage through Prisma
- OpenAI-backed analysis with a graceful local fallback if the live request fails
- Railway-ready runtime startup for persistent cloud hosting

## Stack

- Next.js 15 + TypeScript
- Tailwind CSS
- Prisma + SQLite
- OpenAI Responses API

## Local Environment

The project ships with `.env` and `.env.example`.

Example values:

```bash
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY=""
OPENAI_MEAL_MODEL="gpt-4.1"
MOCK_OPENAI_ANALYSIS="true"
MEAL_PHOTO_STORAGE_DIR=""
```

### Live mode vs fallback mode

- `MOCK_OPENAI_ANALYSIS="true"` forces local heuristic analysis and does not call OpenAI.
- `MOCK_OPENAI_ANALYSIS="false"` uses the live OpenAI path when possible.
- If live analysis fails because of quota or another API error, the app falls back to the local heuristic estimator and labels the result as fallback/demo mode instead of breaking the workflow.

## Install

If you already have Node.js 22+ installed globally, normal `npm` works.

This workspace also includes a local helper wrapper:

```bash
./npmw install
```

## First Run

1. Install dependencies:

```bash
./npmw install
```

2. Sync the database schema:

```bash
./npmw run db:push
```

3. Seed starter data and default targets:

```bash
./npmw run db:seed
```

4. Start the app:

```bash
./npmw run dev
```

5. Open:

```text
http://localhost:3000
```

## Production Run

For a local production-style run:

```bash
./npmw run build
HOSTNAME=127.0.0.1 ./npmw run start
```

The production start script now:

- runs `prisma db push`
- creates Railway volume directories when needed
- starts Next.js on `HOSTNAME` and `PORT`

## Railway Deployment

This app is prepared for Railway with persistent disk storage.

### Railway volume settings

Create a volume and mount it at:

```text
/data
```

### Railway variables

Set these in the Railway service:

```bash
DATABASE_URL=file:/data/dev.db
OPENAI_API_KEY=your_real_key
OPENAI_MEAL_MODEL=gpt-4.1
MOCK_OPENAI_ANALYSIS=false
```

Optional:

```bash
MEAL_PHOTO_STORAGE_DIR=/data/meal-photos
```

You usually do not need `MEAL_PHOTO_STORAGE_DIR` because the app automatically uses:

```text
$RAILWAY_VOLUME_MOUNT_PATH/meal-photos
```

when Railway provides a mounted volume path.

### Railway deploy flow

1. Push this project to GitHub.
2. In Railway, create a new project.
3. Deploy from the GitHub repo.
4. Attach a volume and mount it at `/data`.
5. Add the environment variables above.
6. Generate a public domain in Railway Networking.

The app uses `npm start`, which runs the production startup script and syncs the SQLite schema against the mounted volume before serving traffic.

## Scripts

```bash
./npmw run dev
./npmw run build
./npmw run start
./npmw run start:plain
./npmw run lint
./npmw run typecheck
./npmw run db:push
./npmw run db:seed
./npmw run db:reset
```

## Product Notes

### Meal analysis

`/api/meals/analyze`:

- accepts multipart form data
- validates the uploaded image
- combines the image with the meal description and saved targets
- requests structured JSON from OpenAI
- falls back to the local heuristic analyzer if live analysis is unavailable

### Meal saving

`/api/meals`:

- stores the analyzed meal
- saves the selected meal photo to local disk
- stores the log in SQLite
- supports loading any selected day via `?date=YYYY-MM-DD`

### Photo storage

- Saved meal photos are written to `.data/meal-photos` locally
- On Railway they default to `$RAILWAY_VOLUME_MOUNT_PATH/meal-photos`
- They are served through `/api/photos/[fileName]`
- This works in both dev and production mode

### Targets

- Saved targets are stored in the `UserSettings` table
- The frontend can update them from the dashboard
- The analysis route reads the current saved targets for prompt context

## Files To Know

- `src/components/meal-tracker-app.tsx` -> main UI
- `src/app/api/meals/*` -> meal CRUD + analysis
- `src/app/api/settings/route.ts` -> saved targets
- `src/app/api/photos/[fileName]/route.ts` -> local meal photo serving
- `src/lib/meal-analysis.ts` -> OpenAI + fallback analysis
- `src/lib/meals.ts` -> dashboard aggregation and meal persistence
- `src/lib/settings.ts` -> saved targets helpers
- `src/lib/file-storage.ts` -> local and Railway photo storage rules
- `scripts/start-production.sh` -> production startup entrypoint
- `prisma/schema.prisma` -> database schema
- `prisma/seed.mjs` -> starter targets and sample meals

## Current Limitations

- This is still a local single-user app with no auth or cloud sync
- SQLite is fine for a personal app, but not the right long-term choice for a multi-user product
- Photo analysis quality depends on the API key, model availability, and image quality
- The fallback estimator keeps the app usable, but it is not a substitute for real image understanding
