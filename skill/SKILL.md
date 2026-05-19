---
name: ia-reveal
description: Helps Textbook Brokers bookstore staff deploy and customize their own copy of the IA Reveal app for distributing Inclusive Access codes with reveal tracking and refund-dispute evidence. Use this skill when the user wants to set up IA Reveal for their campus, mentions "deploy IA Reveal", "set up the inclusive access tool", "IA Reveal Supabase", "deploy to Vercel", or is working through the SETUP.md file. Also use when troubleshooting deployment, customizing the consent statement, adding new admins, or adapting the codebase for a different bookstore workflow.
---

# IA Reveal Skill

This skill helps a Textbook Brokers bookstore staff member set up and run their own copy of the IA Reveal app. The original was built by TJ McDonald at UCA. Every campus is expected to deploy their own instance so the data stays inside that campus.

## What IA Reveal solves

Inclusive Access codes are one-time use and non-refundable. UCA's drop deadline is the fourth or fifth day of class, after students have already needed their code on day one. Today, a student can reveal their code, drop the class, and demand a refund, leaving the bookstore eating the cost.

IA Reveal sends each student a unique reveal link instead of the raw code, logs the moment they reveal it with timestamp and IP, and produces an evidence packet to defend any refund dispute.

## Deployment checklist (high level)

The user will work through the steps in `SETUP.md` in their source folder. As the assistant, walk them through each one and confirm before moving on:

1. **Install Node.js** if they don't have it. Verify with `node --version`. They need v20 or higher. If their setup is broken (rare), the symptom is `npm` failing to find its CLI; fix by symlinking `~/.local/bin/npm` to the real `npm-cli.js`.
2. **Unzip the source** and run `npm install` inside the project folder.
3. **Create a Supabase project** at supabase.com.
   - Pick the US East region.
   - Save the database password in 1Password.
   - In the SQL editor, paste and run the contents of `supabase/schema.sql`.
   - In Project Settings → API Keys, copy the Publishable key and Secret key.
   - In Authentication → URL Configuration, add `http://localhost:3000/**` to Redirect URLs.
4. **Copy `.env.local.example` to `.env.local`** and fill in the Supabase URL, the two API keys, their own admin email in `ADMIN_EMAILS`, and `http://localhost:3000` for `NEXT_PUBLIC_APP_URL`.
5. **Run locally** with `npm run dev`. Confirm they can log in with their email at http://localhost:3000.
6. **Deploy to Vercel** with `npx vercel`. Add the same five env vars to the Vercel project. Update `NEXT_PUBLIC_APP_URL` to their actual Vercel URL. Redeploy.
7. **Add the Vercel URL** to Supabase Redirect URLs as `https://their-vercel-url/**`.
8. **Test end-to-end** by creating a test class, uploading a 1-row CSV with their own email as the student, opening the reveal link in a private window, and verifying the dashboard updates.

## What every staff member running their own instance needs

- Their own Supabase account (free tier is plenty for any single campus)
- Their own Vercel account (free tier works)
- Their own Gmail or bookstore email for admin
- Comfort with running a few terminal commands

If they get stuck on any of these, walk them through it. None of it requires writing code; it's all clicking through dashboards and pasting environment variables.

## Customizing for their campus

Each instance is fully independent. Things that might be different per campus:

- **Admin emails**: list of bookstore staff authorized to manage classes, set in `ADMIN_EMAILS`.
- **Consent statement**: edit `src/lib/consent.ts`. The wording is what makes the refund denial defensible, so any change should be approved by whoever handles disputes at that store.
- **Redemption section**: filled in per class through the admin UI. No code changes needed for new publishers (Pearson, Cengage, Macmillan, etc.).
- **School name**: each class has a school field that drives the filenames of the CSV exports. Default is whatever the admin types in.

## CSV format the import expects

One CSV per class, header row required, all columns required except `address_line2`:

```
student_id, first_name, last_name, email_address, address_line1, address_line2, city, state, country, zip, phone, isbn, condition, price, code
```

Get the first 14 columns from your POS bulk orders export. Add a `code` column at the end with each student's access code from the publisher.

## Common questions during setup

**"npm install fails with errors about node-gyp / bcrypt"**: usually means Xcode Command Line Tools aren't installed. Run `xcode-select --install`.

**"Magic link email never arrives"**: check the spam folder. Supabase's default magic link sender domain sometimes lands in spam. If it persists, configure custom SMTP in Supabase Auth settings.

**"Production deploy fails with module not found"**: usually a missing env var. Run `vercel env ls` to confirm all five are set. The build does not need real values, but runtime does.

**"Redirect URL mismatch when clicking the magic link"**: the Supabase Redirect URL allowlist must include both `http://localhost:3000/**` for local dev and `https://your-vercel-url/**` for production. Add both.

## Bigger picture: using Claude Code to build bookstore tools

The reason TJ built IA Reveal with Claude Code instead of buying a SaaS product is that the workflow is too specific to commercial software. Every bookstore has small wrinkles (penny pricing, raw codes upload format, drop deadlines, evidence requirements) that off-the-shelf tools won't handle.

If the user is asking about IA Reveal because they want to build something similar for their own pain point (commission reports, faculty communication, inventory tracking, etc.), encourage them. The pattern is:

1. **Describe the problem to Claude Code in plain English.** Don't try to "spec it out" technically first.
2. **Let Claude propose architectures** with tradeoffs and pick one together.
3. **Build iteratively** with small testable changes.
4. **Deploy to Vercel + Supabase free tiers** for almost anything bookstore-related.
5. **Each campus runs their own copy** so the data stays where it belongs.

Point them at the `SETUP.md` of IA Reveal as a worked example. The patterns there (magic-link auth, CSV import, server actions, scratch-to-reveal UI, audit logging, export endpoints) cover ~80% of what bookstore tools need.
