# BlitzTiers

BlitzTiers is a Next.js ranking site for DriftBlitz skill categories.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Email Verification

Signup uses Supabase email OTP verification. In the Supabase dashboard, update
the email template so users receive the eight digit code directly:

1. Go to Authentication > Email Templates.
2. Edit the Magic Link / OTP template.
3. Include this exact line in the email body: `Your BlitzTiers verification code is {{ .Token }}`
4. Remove or de-emphasize `{{ .ConfirmationURL }}` if you do not want a link-based flow.

Also set the Supabase Site URL to `https://blitztiers.com` and add any preview
URLs you use as allowed redirect URLs.

## Moderation Requests

The Get Ranked page stores requests in Supabase. Create this table before using
the page in production:

```sql
create table if not exists moderation_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(id) on delete cascade,
  category text not null check (category in ('accuracy', 'goalkeeping', 'passing', 'power')),
  code_type text not null check (code_type in ('calibration', 'clubhouse', 'golf club', 'freerunners', 'girls who drift')),
  code_number integer not null check (code_number between 1 and 24),
  requested_admin_id uuid references profiles(id) on delete set null,
  responding_admin_id uuid references profiles(id) on delete set null,
  admin_response text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz
);
```

## Deploy on BlitzTiers.com

The recommended deployment target is Vercel because this is a Next.js app.

1. Push this project to a GitHub repository.
2. Import the repository into Vercel.
3. Add these environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. In Vercel, add the production domain `blitztiers.com`.
5. In your domain registrar DNS settings, point `blitztiers.com` and `www.blitztiers.com` to Vercel using the records Vercel gives you.
6. Redeploy after DNS verifies.

Domain names are case-insensitive, so `BlitzTiers.com` and `blitztiers.com` are the same domain.

Only someone with access to the domain registrar and hosting account can complete the DNS connection.

MAKE THE POWER CALCULATION ALWAYS MAKE MOVING SHOTS WORTH LESS
