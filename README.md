# AI-powered portfolio

Next.js + Tailwind + Framer Motion frontend, Express + MongoDB backend, and an admin
dashboard that turns a one-line idea into a published project (title, SEO blurb,
Markdown write-up, tags, optional thumbnail).

canonical: phz.forge · file: phantomz magic · v10.0

## What is free, and what is not

| Piece | Service | Cost |
|---|---|---|
| Frontend | Vercel Hobby | Free (personal, non-commercial use) |
| Backend | Render free web service | Free, sleeps after 15 min idle (first hit ~50 s) |
| Database | MongoDB Atlas M0 | Free, 512 MB |
| AI text | Google Gemini API free tier | Free, rate-limited |
| Thumbnails | `IMAGE_PROVIDER=none` | Free (gradient placeholder). DALL-E 3 costs money per image |
| Contact email | Resend free tier | Free, 100 emails/day |

No host can promise "free forever": these are today's free tiers and the providers can change them.
Nothing here locks you in; the code runs on any Node host.

## 0. Never commit secrets
`.env` is in `.gitignore`. Put keys in the Render and Vercel dashboards (steps below), not in files you upload to GitHub.

## 1. Put it on GitHub
1. Unzip this archive on your computer.
2. github.com → New repository → name it → Create (leave "add README" unticked).
3. Click "uploading an existing file", drag in the **contents** of the unzipped folder
   (`backend`, `frontend`, `README.md`, `.gitignore`, `.gitattributes`, `render.yaml`), commit.
   The browser upload skips hidden files sometimes; if `.gitignore` is missing, add it with "Add file → Create new file".
   (Or with git: `git init && git add . && git commit -m init && git remote add origin <url> && git push -u origin main`.)

## 2. Personalise
Edit `frontend/lib/site.js`: name, roles, about text, skills, social links. That is the only file you must change.

## 3. Database (MongoDB Atlas)
1. cloud.mongodb.com → create a free **M0** cluster.
2. Database Access → add a user with a password (letters and numbers only avoids URL-encoding problems).
3. Network Access → Add IP `0.0.0.0/0` (Render free has no fixed IP).
4. Connect → Drivers → copy the `mongodb+srv://...` string, put `/portfolio` before the `?`. This is `MONGODB_URI`.

## 4. Keys
- **Gemini (free):** aistudio.google.com/apikey → Create API key → `GEMINI_API_KEY`.
- **Resend (free):** resend.com → API Keys → create → `RESEND_API_KEY`. Keep `RESEND_FROM=onboarding@resend.dev`
  and set `CONTACT_TO` to the email you signed up to Resend with (the sandbox sender can only deliver to that address).
  Render's free tier blocks SMTP ports, which is why the default is Resend over HTTPS rather than Gmail SMTP.
- **JWT_SECRET:** run `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` and copy the output.

## 5. Backend on Render
1. render.com → New → Web Service → connect the GitHub repo.
2. Root Directory `backend`, Build `npm install`, Start `npm start`, Instance type Free, Health Check Path `/health`.
3. Environment → add everything from `backend/.env.example`, filled in. For now set `CLIENT_ORIGIN=http://localhost:3000`.
4. Deploy. Open `https://<your-service>.onrender.com/health`: you should see `{"ok":true}`.
5. Create your admin login: Render → your service → **Shell** (may need a paid plan; if the Shell is unavailable, do this from your own computer instead):
   ```
   cd backend && npm install
   # create backend/.env locally with MONGODB_URI, JWT_SECRET (any 32+ chars), CLIENT_ORIGIN, GEMINI_API_KEY
   npm run seed -- yourusername "a-long-password-12+"
   ```
   The seed writes to the same Atlas database, so it works from anywhere. Do not commit that local `.env`.

## 6. Frontend on Vercel
1. vercel.com → Add New → Project → import the repo.
2. Root Directory `frontend`. Framework: Next.js (auto).
3. Environment Variable: `NEXT_PUBLIC_API_URL=https://<your-service>.onrender.com`
4. Deploy. Copy the Vercel URL.
5. Back in Render → Environment → set `CLIENT_ORIGIN` to that exact Vercel URL (https, no trailing slash) → it redeploys.
   If you add a custom domain later, update `CLIENT_ORIGIN` to match.

## 7. Use it
- Go to `https://<your-vercel-url>/admin`, sign in, describe a project, click **Generate & Publish**.
- It appears on the home page within about a minute and gets its own page at `/projects/<slug>`.

## 8. Keep the free backend awake (optional)
Render free sleeps after 15 minutes. Create a free monitor at uptimerobot.com: HTTP(S), URL
`https://<your-service>.onrender.com/health`, interval 5 minutes. A free instance has about 750 hours per month,
which covers one always-on service.

## Run locally
```
cd backend && cp .env.example .env   # fill it in, CLIENT_ORIGIN=http://localhost:3000
npm install && npm run seed -- admin "a-long-password-12+" && npm run dev
cd ../frontend && cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:5000
npm install && npm run dev
```

## Optional paid upgrade: AI thumbnails
Set `IMAGE_PROVIDER=openai`, `OPENAI_API_KEY=...` (billing enabled). Images are stored in MongoDB.
Each image uses part of your 512 MB free Atlas quota (roughly 2-4 MB each).

## Tamper layer
On startup the backend hashes `backend/src/**/*.js` and compares against `backend/integrity.manifest.json`,
and checks the embedded mark. On mismatch it writes a `tamper_detected` log line and keeps running.
**After you edit any backend `.js` file, run `cd backend && npm run seal` and commit the new manifest**, or you
will see that warning in the logs (harmless but noisy). Optional beacon: `TAMPER_BEACON_ENABLED=true` plus
`TAMPER_BEACON_URL` posts a JSON ping to a URL you control.

## Troubleshooting
- **Render logs `Invalid environment`:** a variable is missing; the log lists which.
- **Browser CORS error:** `CLIENT_ORIGIN` does not exactly match the Vercel URL.
- **Admin login hangs ~50 s:** the free backend was asleep. Normal.
- **`AI_AUTH` / `AI_RATE_LIMIT` in the admin error:** bad Gemini key, or free-tier quota hit; wait and retry.
- **Gemini model not found:** change `GEMINI_MODEL` (model names change; see ai.google.dev/gemini-api/docs/models).
- **Contact form says "not configured":** set `CONTACT_TO` and `RESEND_API_KEY` on Render.
- **Contact email fails with Resend 403:** with the sandbox sender, `CONTACT_TO` must equal your Resend account email, or verify a domain.
- **Home page shows no projects right after deploy:** the API was asleep during build; wait 60 s and refresh.
