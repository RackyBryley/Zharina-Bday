# Zharina-Bday — Birthday Wishes Guestbook

Static GitHub Pages birthday website with a Supabase-powered guestbook. The existing slides, visual theme, effects, and accounting mini-game are preserved; the new guestbook is an additional slide before the finale.

## Files added

- `wishes.js` — guestbook UI, validation, submit/read, and optional realtime refresh.
- `supabase-config.js` — public Supabase project URL and anon/publishable key placeholders.
- `supabase-setup.sql` — table, constraints, index, and Row Level Security policies.
- `.nojekyll` — tells GitHub Pages not to run Jekyll processing.

## Set up Supabase

1. Create a project at https://supabase.com/.
2. In Supabase, open **SQL Editor**, create a query, paste all of `supabase-setup.sql`, and run it.
3. Open the project's **Connect** or **Project Settings → API** page. Copy the Project URL and the **publishable/anon public key**.
4. Edit `supabase-config.js` and replace the two placeholders:

   ```js
   export const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
   export const SUPABASE_ANON_KEY = 'YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY';
   ```

5. Never put a `service_role` key or secret key in this website. Browser code is public.
6. Optional realtime: in Supabase Database/Replication, enable Realtime for `public.birthday_wishes`. Reading and submitting still work without realtime; new messages will refresh after submit or page load.

## Upload to GitHub Pages

1. Extract this ZIP.
2. Upload the *contents* of this folder to the root of `https://github.com/RackyBryley/Zharina-Bday` (not the outer folder itself), including `images/`, `.nojekyll`, `supabase-config.js`, `wishes.js`, and `supabase-setup.sql`.
3. Commit the changes.
4. In repository **Settings → Pages**, select **Deploy from a branch**, branch `main`, folder `/(root)`.
5. Wait for deployment and open `https://rackybriley.github.io/Zharina-Bday/`.

## Anti-spam and security notes

- Client checks enforce name/message lengths; the hidden honeypot and 30-second per-browser cooldown deter simple bots and accidental repeated submissions.
- Database constraints and Row Level Security enforce length limits and allow public read/insert only. The public browser role has no update/delete policy.
- These are baseline safeguards, not strong abuse prevention. A public anonymous insert endpoint can still be abused by determined bots or repeated requests from different browsers. For a high-traffic public site, route submissions through a Supabase Edge Function with CAPTCHA (e.g. Turnstile), server-side rate limiting, and moderation.
- Because the requested behavior is immediate publication, submitted messages appear publicly. Do not ask visitors for sensitive or private information. You can remove abusive messages from the Supabase dashboard as the project owner.
- Messages are displayed using `textContent`, not injected as HTML, to prevent submitted text from being interpreted as markup.

## Local testing

Because `wishes.js` uses browser ES modules, serve the folder over HTTP instead of opening `index.html` directly. If Node.js is installed:

```bash
npx serve .
```

Then open the local URL it prints. After configuring Supabase, test submitting a wish, refreshing the page, and opening the site in a private window to confirm the public guestbook works.
