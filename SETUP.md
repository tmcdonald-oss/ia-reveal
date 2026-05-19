# IA Reveal · Setup

A small Next.js + Supabase app that delivers inclusive-access codes to students via unique reveal links, logs each reveal with timestamp + IP, and exports the artifacts you need for Gmail mail merge and your POS bulk order upload.

## What you need to do

There are 3 things only you can do. Everything else is built.

1. Create a Supabase project (5 min)
2. Connect Vercel and deploy (5 min)
3. Test the end-to-end flow with one fake student (10 min)

---

## 1. Create the Supabase project

1. Go to https://supabase.com/dashboard and click **New project**.
2. Name it `ia-reveal`. Pick the region closest to Arkansas (US East). Generate a database password and **save it** somewhere safe (1Password, etc.).
3. Wait ~1 minute for the project to provision.
4. Open the **SQL editor** in the sidebar. Click **New query**. Paste the contents of `supabase/schema.sql` from this repo. Click **Run**. You should see "Success. No rows returned."
5. Go to **Project Settings → API** in the sidebar. Copy these three values into your local `.env.local` file (which already exists with placeholders):
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (under "Project API keys") → `SUPABASE_SERVICE_ROLE_KEY`

   **Service role key is a master key.** Never paste it into the browser, never commit it to Git. The `.gitignore` already excludes `.env.local`.

6. Go to **Authentication → URL Configuration**. Add these to **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000`
   - (We'll add your Vercel URL here after deploying.)

7. Go to **Authentication → Providers → Email**. Make sure **Enable Email provider** is on. Magic links work by default; you do not need to enable signups.

That's it for Supabase.

---

## 2. Run it locally to test

```
cd ~/projects/ia-reveal
npm run dev
```

Open http://localhost:3000. You'll be redirected to /login. Enter your email (must match `ADMIN_EMAILS` in `.env.local`). Check your inbox for the magic link. Click it. You should land on `/admin`.

Create a test class. Upload a small test CSV (see format below). Open one of the generated reveal URLs in a private window to simulate being a student. Scratch the code, watch the admin dashboard update.

### CSV format for the roster upload

Required columns, in any order, header row required:

```
student_id, first_name, last_name, email_address, address_line1, address_line2, city, state, country, zip, phone, isbn, condition, price, code
```

All required except `address_line2`. Example:

```
student_id,first_name,last_name,email_address,address_line1,address_line2,city,state,country,zip,phone,isbn,condition,price,code
B01293844,Jenna,Ward,jward29@cub.uca.edu,201 Donaghey Ave,,Conway,AR,US,72035,(501) 336-0166,9781579313197,digital,0.01,XXXX-YYYY-ZZZZ-AAAA
```

---

## 3. Deploy to Vercel

1. Push this directory to a private GitHub repo (or use the Vercel CLI to deploy without GitHub).
2. In Vercel, click **Add New → Project** and import the GitHub repo.
3. In the project settings, add the same environment variables from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_EMAILS=tmcdonald@textbookbrokers.com`
   - `NEXT_PUBLIC_APP_URL=https://your-vercel-url.vercel.app` (use the URL Vercel gives you after first deploy)
4. After the first deploy succeeds, copy the production URL.
5. Back in Supabase → **Authentication → URL Configuration**, add the production URL to **Redirect URLs**:
   - `https://your-vercel-url.vercel.app/auth/callback`
   - `https://your-vercel-url.vercel.app`
6. Update `NEXT_PUBLIC_APP_URL` in Vercel to that production URL and redeploy.

---

## How the workflow runs for a real class

1. **Create the class** in the admin: course, instructor, term, dates, publisher.
2. **Upload the roster + codes CSV** to that class. The system generates a unique reveal URL per student.
3. **Download the Mail Merge CSV.** Run a Gmail mail merge (GMass, or Gmail's built-in multi-send) using the reveal URL column. Send.
4. **Download the Bulk Orders CSV.** Upload to your POS web orders screen. Then upload your placeholder raw codes (`"Please review email for one time access code."`) separately as you normally would.
5. **Watch the admin dashboard** as students click their links and reveal codes. Each reveal is logged.
6. **If a refund is disputed**, open that student's row → **Evidence** → print or save as PDF.

---

## Files of note

- `supabase/schema.sql` — database tables, RLS, audit view
- `src/lib/consent.ts` — the consent statement shown to students. Edit if legal/admin wants different wording.
- `src/app/r/[token]/` — student reveal page
- `src/app/admin/` — admin UI
