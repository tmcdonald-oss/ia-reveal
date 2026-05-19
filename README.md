# IA Reveal

A small web app for delivering Inclusive Access codes to students through trackable, scratch-to-reveal links. Built for Textbook Brokers bookstores to defend against refund disputes when students reveal a code and then drop the class.

Each bookstore is expected to run its own copy. Your student data stays in your own database. You control admin access for your store.

## What it does

- Sends each student a unique URL instead of the raw code
- Renders a "scratch to reveal" page with the consent statement
- Logs first-reveal timestamp, IP, and user agent
- Exports a Mail Merge CSV for Gmail and a Bulk Orders CSV for the POS
- Generates a printable evidence packet for refund disputes

## Set up your own copy

See [SETUP.md](./SETUP.md) for the full walkthrough.

If you use Claude Code, install the bundled skill (in [`skill/`](./skill)) and ask:

> Help me deploy my own copy of IA Reveal.

Claude will walk you through Supabase, Vercel, env vars, and a test deployment.

## Stack

- Next.js 16 (App Router) on Vercel
- Supabase Postgres + Auth (magic link)
- Tailwind CSS

## Customize for your store

- **Consent statement**: edit [`src/lib/consent.ts`](./src/lib/consent.ts)
- **Admin emails**: set the `ADMIN_EMAILS` env var (comma-separated)
- **Redemption section** (publisher, URL, instructions, button label): per class through the admin UI

## License

Internal Textbook Brokers tool. Use within the company freely.
