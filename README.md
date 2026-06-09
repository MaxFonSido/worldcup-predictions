# World Cup Predictions ⚽️

A small private prediction game for friends and family. English + Farsi, one shared web link, free to run.

You don't need to touch the code. Setup is three free accounts and some copy-paste. Take it one step at a time — about 20 minutes.

---


## What you'll set up

1. **Supabase** — the database (stores players, picks, scores). Free.
2. **football-data.org** — the live results feed. Free token.
3. **Vercel** — hosts the website and gives you the link to share. Free.

---

## Step 1 — Database (Supabase)

1. Go to supabase.com, sign up, and create a new project. Wait a minute for it to finish setting up.
2. In the left menu open **SQL Editor** → **New query**.
3. Open the file `supabase-schema.sql` from this project, copy everything, paste it in, and click **Run**. You should see "Success".
4. Open **Project Settings → API**. Keep this tab open — you'll copy two values in Step 4:
   - **Project URL**
   - **service_role** key (the secret one)

## Step 2 — Results feed (football-data.org)

1. Go to football-data.org/client/register and sign up (free).
2. They email you an **API token**. Save it for Step 4.

## Step 3 — Two passwords you invent

Make up two long random strings (just mash the keyboard, ~30 characters each). One is `SESSION_SECRET`, the other is `CRON_SECRET`. Save them.

## Step 4 — Deploy (Vercel)

1. Put this project on GitHub (or use Vercel's "import" with the folder).
2. Go to vercel.com, sign up, and **Add New → Project**, then pick this project.
3. Before deploying, open **Environment Variables** and add these five:

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | the Project URL from Step 1 |
   | `SUPABASE_SERVICE_ROLE_KEY` | the service_role key from Step 1 |
   | `FOOTBALL_DATA_TOKEN` | the token from Step 2 |
   | `SESSION_SECRET` | your first random string |
   | `CRON_SECRET` | your second random string |

4. Click **Deploy**. When it's done, Vercel gives you a link like `your-app.vercel.app`.

## Step 5 — Share it

Send the link to family. The first time someone opens the **Matches** tab, the app pulls in all 104 World Cup games automatically. Each person picks a name + 4-digit PIN on their first visit — that's their login forever.

---

## Good to know

- **Scores update on their own.** Whenever anyone opens the app, it refreshes results from the feed (at most once every 5 minutes). The hourly background refresh in `vercel.json` is a bonus and needs no setup.
- **Betting locks at kickoff.** Once a match starts, its picks are frozen.
- **Need to fix a result by hand?** Supabase has a built-in table editor (Table Editor → `matches`) where you can correct a row if the feed ever gets something wrong.
- **Local testing:** copy `.env.example` to `.env.local`, fill in the same five values, then `npm install` and `npm run dev`.
