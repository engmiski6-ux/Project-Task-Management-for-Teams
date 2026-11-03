# TaskFlow — Project Task Management for Teams

HTML5 · Tailwind CSS (CDN) · Vanilla JS · Supabase

**Layout:** Dark navy sidebar (`#0B132B` / `#1C2541`) · White / light main content  
**Activity:** Terminal-style logs with masked usernames · No decorative icons in feeds

---

## Quick start

Open `index.html` or serve the folder:

```bash
npx --yes serve .
```

Without Supabase keys the app runs on localStorage. Sign in with seeded accounts (e.g. username `miski`, password `miski123`). Demo helpers are **not** shown on the login UI.

---

## Supabase

1. Run `supabase/schema.sql`
2. Create Auth users (password `miski123`), then run `supabase/seed.sql`
3. Set keys in `js/config.js`:

```js
SUPABASE_URL: 'https://YOUR_PROJECT.supabase.co',
SUPABASE_ANON_KEY: 'YOUR_ANON_KEY',
```

---

## Modules

Dashboard · Projects · Tasks (My Tasks / Kanban / Calendar) · Team · Reports · Activity Log · Settings

---

## Structure

```
index.html          Landing + auth (hero image, no demo boxes)
app.html            App shell
css/styles.css
js/config.js        Supabase keys
js/utils.js         Safe date formatters + name masking
js/api.js           Demo / Supabase API
js/views/           Feature views
supabase/           schema.sql, seed.sql
```
