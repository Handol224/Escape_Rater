# Escape Rater — Setup Guide

Follow these steps once to get the app live. Takes about 15 minutes.

---

## Step 1 — Create a Supabase project

1. Go to https://supabase.com and sign up (free)
2. Click **New project**, give it a name like `escape-rater`, set a database password
3. Wait ~1 minute for it to provision

---

## Step 2 — Run the database schema

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase/schema.sql` from this project
4. Paste the entire contents into the SQL editor
5. Click **Run**

You should see "Success. No rows returned."

---

## Step 3 — Make yourself admin

After running the schema, you need to create your account first, then make it admin.

1. Go to your deployed app (or run locally first — see Step 6)
2. Sign up with your email/password
3. Back in Supabase SQL Editor, run:

```sql
UPDATE profiles
SET is_approved = TRUE, is_admin = TRUE
WHERE username = 'YourUsername';
```

Replace `YourUsername` with the username you signed up with.

---

## Step 4 — Get your Supabase credentials

1. In Supabase, go to **Project Settings** → **API**
2. Copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public** key (the long string under "Project API keys")

---

## Step 5 — Deploy to Vercel

1. Push this project to GitHub:
   ```bash
   git add .
   git commit -m "initial"
   # Create a new repo on github.com, then:
   git remote add origin https://github.com/YOUR_USERNAME/escape-room-rater.git
   git push -u origin main
   ```

2. Go to https://vercel.com, sign up with GitHub
3. Click **Add New Project**, import your `escape-room-rater` repo
4. In the **Environment Variables** section, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Project URL from Step 4
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key from Step 4
5. Click **Deploy**

Vercel will give you a URL like `https://escape-room-rater.vercel.app`. Share that with your friends!

---

## Step 6 — Run locally (optional)

```bash
# Copy the example env file
cp .env.local.example .env.local

# Edit .env.local and fill in your Supabase credentials
# Then run:
npm run dev
```

Open http://localhost:3000

---

## How it works

| Who | Can do |
|-----|--------|
| Admin (you) | Add escape rooms, add game slots, approve users, see all individual ratings |
| Players | Sign up, rate past sessions, see rankings |

- Players sign up → you approve them in the **Admin** panel
- You add rooms and game slots from the **Admin** and **Calendar** pages
- After a session's time has passed, players can rate it (1–10 on 5 categories)
- The **Rankings** page shows all rooms sorted by your group's scores
- Sort by: Overall, Puzzles, Story & Theme, Atmosphere, Difficulty, Game Master, or Time Played

---

## Rating categories

| Category | What it measures |
|----------|-----------------|
| Puzzles | Quality and creativity of the puzzles |
| Story & Theme | Narrative, setting, and immersion |
| Atmosphere | Decor, effects, and set design |
| Difficulty | How challenging the room was |
| Game Master | Quality of the host/game master |
