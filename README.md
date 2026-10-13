# Lantern House for GitHub + Vercel

## What this version changes

The architecture, house assets, walkthrough, mezzanine, four lighting modes and presentation UI come from the deployed Edition 05 code. This copy replaces the platform-specific server with standard Next.js and Supabase. It adds email/password sign-in and sign-out. Records remain shared among explicitly approved project members; only their author can update a record's status. The model, plans, API and screenshot storage are private. There is one house/project per installation.

## 1. Create the backend

1. Create a Supabase project that you own. Use a new project to avoid table or policy name collisions.
2. Open its SQL Editor. Run **`supabase/schema.sql` once**. It creates the records table, project membership table, access policies and private `review-images` bucket.
3. In Authentication settings, disable public sign-ups for this private studio.
4. In Authentication → Users, create your owner account with an email and password (confirm the email through the dashboard if necessary). Copy that user's UUID.
5. Run this SQL separately, replacing the example UUID with your actual account UUID:

   ```sql
   insert into public.project_members(user_id)
   values ('YOUR-AUTH-USER-UUID');
   ```

6. Repeat user creation and membership insertion for each client/reviewer you want to authorize. There is no in-app account registration. Membership changes are made by you in the Supabase dashboard. A nonmember cannot see the house even if they have an authenticated account.
7. Find the project's URL and **publishable key** in its Connect/API settings. Do not use a secret or service-role key. This application uses row-level security and does not require a service-role key.

## 2. Run locally

Use Node.js **22.13 or newer** (Node 22 LTS recommended) and npm.

```sh
npm ci
```

Copy `.env.example` to `.env.local` (on Windows you can use File Explorer), then fill in:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLISHABLE-KEY
```

```sh
npm run dev
```

Open `http://localhost:3000`, sign in with the account you created, and enter Walk Mode. These variables are public project identifiers; authorization is enforced by authenticated sessions, explicit membership and database/storage policies. Never place your account password, a service-role key or database password in them.

If the variables are missing, the app deliberately shows setup instructions instead of exposing the house. Use the Supabase dashboard for account/password recovery. Password-reset email and invitation acceptance pages are not implemented in this handoff.

### Local mode (no Supabase)

To try the full studio on your own computer before Supabase exists, put `LANTERN_LOCAL_MODE=1` in `.env.local` and run `npm run dev`. Sign-in is skipped and records/screenshots are saved to `.local-data/` (gitignored). Local mode only works under `npm run dev`; production builds, including Vercel, ignore it and keep the normal sign-in. Remove the line once your Supabase variables are in place.

## 3. Put it in your GitHub

Simplest option: make **the contents of `vercel-app/` the root of your new private GitHub repository**. Include `.gitignore`, `.env.example`, `package-lock.json`, `public/`, `viewer/`, `supabase/`, and every other source file. Do not upload `node_modules`, `.next`, `.env.local`, or account secrets.

With Git installed, run inside this folder:

```sh
git init
git add .
git commit -m "Import Lantern House"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with the URL of the repository you created. The archive intentionally has no existing Git remote, repository history or access token.

If you instead upload the entire handoff as a repository, set Vercel's Root Directory to **`vercel-app`**. Do not choose `original-source`.

## 4. Deploy to Vercel

1. Import your GitHub repository into Vercel.
2. Select the **Next.js** framework preset and Node.js **22.x**.
3. Root Directory: repository root if you uploaded the contents of this folder; otherwise `vercel-app`.
4. Install command: `npm ci`. Build command: `npm run build`. Leave Output Directory at the Next.js default. Do not select static export.
5. Add the two Supabase variables above to Production and any Preview/Development environments you want to use.
6. Deploy. Add your Vercel URL/custom domain to Supabase's Authentication URL Configuration for your project. This implementation uses password sign-in rather than an OAuth callback.
7. Open the deployment and complete the acceptance checklist below. If environment variables change, redeploy: `NEXT_PUBLIC_` values are incorporated during build.

Vercel hosts the application; Supabase hosts authentication, records and private screenshot objects. Their service plans/costs are separate. This ZIP does not create accounts, buy services, publish a repository, or transfer the existing hosted data.

## 5. Acceptance checklist on your deployment

- Signed out: `/`, `/viewer.html`, floor-plan SVGs and `/api/review` must not reveal project data. `/login` should work.
- Owner signs in and reaches the entrance. An authenticated nonmember is denied.
- Visit both ground-floor bedrooms, use the stairs up to the mezzanine/library and return.
- Turn with the mouse, move with WASD/arrows, minimize/restore controls, and switch into and out of Overview.
- Test Day, Midday, Dusk and Evening, plus immersive mode.
- Save a viewpoint, reload, restore it, copy its link, and reopen that link while signed out (sign-in must be required and the view preserved afterward).
- Pin a note and confirm its screenshot persists after reload.
- Create a decision/specification; change its status; check the meeting report.
- Sign in as a second approved reviewer: shared records should be visible, but editing another user's status must fail.
- Sign out and verify the project can no longer be opened.
- Check GPU rendering, shadows and performance on your presentation computer. The export environment could not run WebGL.

## Editing the design

- `app/page.tsx`, `app/globals.css`: main studio interface.
- `viewer/house-scene.js`: source house geometry and furniture.
- `viewer/mezzanine.js`: finalized mezzanine design.
- `viewer/immersive/engine.js`: navigation, collisions, camera, lighting and snapshots.
- `viewer/immersive/ui.js`, `interface.html`, `style.css`, `studio-bridge.js`: inner viewer UI and its connection to the studio.
- `viewer/tour/nodes.json`: room destinations.
- `viewer/*-plan.svg`: editable plans; corresponding `public/*-plan.svg` files serve the no-WebGL fallback.
- `public/viewer.html`: generated self-contained viewer; do not make design edits only here.
- `app/api/review/route.ts`: Supabase-backed record and screenshot API.
- `proxy.ts`, `lib/supabase/server.ts`, `app/api/auth/`, `app/login/`: session verification and private sign-in.
- `supabase/schema.sql`: database and private storage policies.

After editing viewer source:

```sh
npm run viewer:build
npm run test:walk
npm run test:api
npm run typecheck
npm run build
```

`viewer:build` needs Python 3. On Windows, if `python3` is not recognized, use `py -3 viewer/immersive/build.py`. The normal app build uses the already-generated viewer and does not need Python. If you edit a plan SVG, copy it to `public/` too. Commit both the source and regenerated viewer.

The route tests use real Three.js geometry and controller code with drawing stubbed. They test navigation, not GPU rendering. The original Cloudflare API tests are retained under `../original-source/tests/`; they are not Supabase integration tests.

## Official references

- Next.js on Vercel: https://vercel.com/docs/frameworks/full-stack/nextjs
- Supabase cookie-based sessions: https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs
- Supabase row-level security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Private storage policies: https://supabase.com/docs/guides/storage/security/access-control

`test:api` executes the Vercel API handlers with a mock Supabase client. It checks request/response behavior and authorization decisions, but does not verify live Supabase policies or credentials.
