# Zharina-Bday: Birthday Website + Live Wishes Wall

Static GitHub Pages site. Slide 18 (the last one) is the **Birthday Wishes Wall**: a pinned message
"From Europac Team", Ma'am Zharina's photo, and a live wall of messages from everyone.
`wishes.html` is the page where people write their message; it appears on the wall right away.

## Files

- `index.html`, `style.css`, `script.js`, `game.js`: the birthday slides and accounting mini-game.
- `wall.js`: loads the wishes onto the last slide and refreshes them live (also every 30 seconds as a backup).
- `wishes.html`, `wishes.js`, `wishes.css`: the page where visitors send a wish. Share this link (or let them tap "Leave a Birthday Wish" on the wall).
- `supabase-config.js`: your public Supabase URL and key (fill in once).
- `supabase-setup.sql`: creates the table, the security rules, and turns on live updates.
- `images/zharina.jpg`: her photo (shown on the wall).
- `.nojekyll`: tells GitHub Pages not to run Jekyll.

## One-time Supabase setup (needed for the wall to work)

1. Create a free project at https://supabase.com/.
2. Open **SQL Editor**, paste all of `supabase-setup.sql`, and run it.
3. Open **Project Settings > API** and copy the **Project URL** and the **anon / publishable key**.
4. Edit `supabase-config.js` and replace the two placeholders:

   ```js
   export const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
   export const SUPABASE_ANON_KEY = 'YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY';
   ```

5. Never put a `service_role` or secret key in this site. Browser code is public.

## Upload to GitHub Pages

1. Unzip, then upload the **contents** of the folder to the root of your repo (including `images/`, `.nojekyll`, and all `.js`/`.css`/`.html` files).
2. Commit. In **Settings > Pages**, choose **Deploy from a branch**, branch `main`, folder `/(root)`.
3. Open your site. Slide 18 is the wall. `index.html#wall` opens straight to it.

## How it works

- A visitor opens `wishes.html`, writes a name and a message, and sends it.
- The message is saved in Supabase and shows on the wall immediately (live), newest first.
- Messages are shown as plain text, so nobody can inject code.
- Basic anti-spam: length limits, a hidden honeypot field, and a 30-second wait per browser.

## Removing a message

Open Supabase > **Table Editor** > `birthday_wishes`, select the row, and delete it. Visitors cannot edit or delete messages.

## Edit the "From Europac Team" message

It is plain text in `index.html`, inside `<article class="team-note">`.

## Local testing

`wall.js` and `wishes.js` are ES modules, so serve the folder over HTTP (for example `npx serve .`) instead of double-clicking `index.html`.
