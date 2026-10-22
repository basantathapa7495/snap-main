# Private teacher photo gateway

`worker.js` is an ES module Worker bound to the private `nepsom-profile-images` R2 bucket as `AVATARS`. Bind `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `ALLOWED_ORIGINS`, and a random secret `SIGNING_SECRET` in Cloudflare. Attach `images.nepsom.xyz` as a Worker custom domain. R2's public `r2.dev` access and R2 custom domains must stay disabled.

The browser presents its Supabase access token to `/sign` or `/object/{path}`. The Worker verifies it with Supabase Auth and checks the linked teacher row through RLS. `/photo/{path}` accepts only one-hour HMAC-signed URLs. Teacher pictures are resized to WebP in the browser, and unique object names allow long browser caching without stale replacements.

The six legacy Supabase objects were copied to R2 at their original keys and checked against their original byte sizes on 2026-10-23 (Nepal time). The temporary cron trigger has been removed. Deploy the frontend and verify its private image delivery before applying the migration that returns the old Supabase bucket to private. Retain the legacy objects for rollback. Never expose R2 API credentials or the signing secret to the browser.
