# Meal Macro Tracker

A local-first meal tracking app that uses a meal photo plus a short description to estimate macros, save the meal with its photo, and compare each day against user-specific targets.

## What This Version Includes

- Meal analysis from photo + short text description
- Email/password accounts with private per-user dashboards
- Structured macro estimate with confidence and assumptions
- Editable review step before saving
- Stored meal photos with private access per signed-in user
- Daily log with edit and delete support
- Manual daily targets saved in the database
- Guided goal calculator with age, sex, height, weight, activity, cut/maintain/bulk, and macro preferences
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
AUTH_SECRET="replace-with-a-random-32-plus-character-secret"
ADMIN_EMAILS="you@example.com"
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

The seed creates a demo account you can sign into locally:

```text
Email: demo@mealtracker.local
Password: DemoTracker123!
```

## Production Run

For a local production-style run:

```bash
./npmw run build
HOST=127.0.0.1 ./npmw run start
```

The production start script now:

- runs `prisma db push`
- creates Railway volume directories when needed
- starts Next.js on `HOST` and `PORT`

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
AUTH_SECRET=use-a-long-random-secret-here
ADMIN_EMAILS=you@example.com
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

After you redeploy, each person must create their own account from the shared Railway URL. Meals, targets, and stored photos are then filtered to the signed-in user.

The production startup script now refuses to boot on Railway if `DATABASE_URL` points outside the mounted volume while using SQLite. That prevents silent account resets caused by deploying onto ephemeral storage.

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

`typecheck` now runs `next typegen` first so route types stay in sync even from a clean checkout.

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
- Photo routes now require the signed-in user to own the related meal log
- This works in both dev and production mode

### Targets

- Saved targets are stored per user in the `UserSettings` table
- The frontend can update them from the dashboard
- The analysis route reads the current saved targets for prompt context

### Accounts

- Sign up and sign in use email/password credentials
- Sessions are stored with secure HttpOnly cookies
- Each `MealLog`, `UserSettings`, and saved meal photo belongs to one user
- Older global rows without a user stay hidden and do not appear in signed-in dashboards

### Admin dashboard

- The admin page lives at `/admin`
- It shows signed-up users, account created date, meal counts, and last activity
- It also includes system diagnostics for database path, Railway volume usage, auth secret fingerprint, session counts, and backend warnings
- It only works for emails listed in `ADMIN_EMAILS`
- The data comes from the same live SQLite database file the app already uses on Railway
- Password hashes are never shown in the admin page
- The system diagnostics route is `GET /api/admin/system`

## Files To Know

- `src/components/meal-tracker-app.tsx` -> main UI
- `src/app/api/meals/*` -> meal CRUD + analysis
- `src/app/api/settings/route.ts` -> saved targets
- `src/app/api/admin/users/route.ts` -> protected admin user summary endpoint
- `src/app/api/admin/system/route.ts` -> protected backend diagnostics endpoint
- `src/app/admin/page.tsx` -> admin page route
- `src/app/api/photos/[fileName]/route.ts` -> local meal photo serving
- `src/lib/meal-analysis.ts` -> OpenAI + fallback analysis
- `src/lib/meals.ts` -> dashboard aggregation and meal persistence
- `src/lib/settings.ts` -> saved targets helpers
- `src/lib/admin.ts` -> admin access rules and user snapshot query
- `src/lib/system-diagnostics.ts` -> deployment and persistence diagnostics
- `src/lib/file-storage.ts` -> local and Railway photo storage rules
- `scripts/start-production.sh` -> production startup entrypoint
- `prisma/schema.prisma` -> database schema
- `prisma/seed.mjs` -> starter targets and sample meals

## Current Limitations

- There is still no password reset or email verification flow
- SQLite is fine for this MVP, but not the right long-term choice for a larger multi-user product
- Admin access currently depends on a simple email allowlist via `ADMIN_EMAILS`
- Photo analysis quality depends on the API key, model availability, and image quality
- The fallback estimator keeps the app usable, but it is not a substitute for real image understanding
