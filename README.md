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

Signup uses a custom six digit email code sent through Resend. `/api/send-otp`
generates a random code and stores it in Supabase, then `/api/verify-otp`
checks the code, creates the Supabase auth user with `email_confirm: true`, and
lets the login page sign the user in with their password.

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` (optional; defaults to `BlitzTiers <noreply@yourdomain.com>`)

## Deploy on BlitzTiers.com

The recommended deployment target is Vercel because this is a Next.js app.

1. Push this project to a GitHub repository.
2. Import the repository into Vercel.
3. Add these environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
4. In Vercel, add the production domain `blitztiers.com`.
5. In your domain registrar DNS settings, point `blitztiers.com` and `www.blitztiers.com` to Vercel using the records Vercel gives you.
6. Redeploy after DNS verifies.

Domain names are case-insensitive, so `BlitzTiers.com` and `blitztiers.com` are the same domain.

Only someone with access to the domain registrar and hosting account can complete the DNS connection.
