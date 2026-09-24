# School registration email verification

The school signup page sends a six-digit code through Resend. The account is created only after the code is confirmed. Supabase Auth still stores the account and signs the principal in.

## Production setup

1. Use the `nepsom.xyz` domain you added in Resend. Publish the DNS records shown by Resend and wait for its status to become **Verified**. Your website can continue using `www.nepsom.xyz`. A separate sending subdomain is optional; if you add one later, change the sender address below to match it.
2. In the Vercel project, set these server-only environment variables for Production and Preview:
   - `RESEND_API_KEY` — a Resend API key with permission to send email.
   - `RESEND_FROM_EMAIL` — `NEPSOM <verify@nepsom.xyz>` for the domain you added. Use an address at the verified domain.
   - `SUPABASE_SERVICE_ROLE_KEY` — the Supabase legacy service role key. This is required for the private verification table and Auth Admin API. Never use a `NEXT_PUBLIC_` prefix for it.
3. Redeploy the project after setting the variables. The SQL migration `supabase/migrations/20260924000000_school_email_challenges.sql` must also be applied to the Supabase project.

The code expires after ten minutes. Requests have a one-minute cooldown, a limit of three per email address per hour, and ten per IP per hour. A code permits five attempts and can be used once.
