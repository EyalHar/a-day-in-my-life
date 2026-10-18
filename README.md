# A Day in My Life (יום בחיי)

A personal daily journal app. For any given date you can add entries of different types — a photo, free writing, a thought, a recipe, a commitment you're taking on (קבלה על עצמי בלי נדר), a plan, a dream, or "other" — and browse between days with a monthly Gregorian + Hebrew calendar. Entries can be marked "private," which locks them behind a separate password. Commitments can recur, track a daily counter, include Tehillim readings (including splitting the whole book across the commitment's days), and trigger hourly browser reminders until they're marked done.

The app is meant to run **locally** — all data stays on your machine.

## Tech stack

- **Frontend:** React 18 (function components + hooks), React Router v7, TanStack Query (React Query) v5, Vite 5, date-fns, @hebcal/hdate (Hebrew dates), CSS Modules
- **Backend:** Node.js + Express 4
- **Database:** SQLite via the built-in `node:sqlite` module (`DatabaseSync`) — no external DB dependency, the file is created automatically under `server/data/`, and schema changes are migrated automatically on startup
- **Files:** image uploads handled with Multer, stored under `server/uploads/`
- **Security:** the private-content password is hashed with bcryptjs, access is granted via a temporary token (in-memory sessions)
- **External:** Tehillim text is fetched from the public [Sefaria](https://www.sefaria.org) API (cached in memory by the server)

## Main features

### Days & entries
- **Daily feed by date** (`/day/:date`) for adding entries of different types: photo 📷, writing ✍️, thought 💭, recipe 🍲, commitment 🌱, plan 🗺️, dream 🌙, other ✨
- **Monthly calendar** with Gregorian and Hebrew dates (Rosh Chodesh marked), a dot on days that have content, and quick navigation between days
- **Recipes page** (`/recipes`) — pulls together every "recipe" entry from every date in one place
- **Optional URL link** on any entry

### Photos
- **Count-aware gallery** — a single photo is shown full-width and uncropped (portrait photos get a blurred backdrop), two photos side by side, three or more as a mosaic with a `+N` overlay
- **Lightbox** — click a photo to view it full-screen; arrow keys / swipe to navigate, Esc to close; captions shown below
- **Day cover** — mark any photo as "תמונת היום" to show it as a banner at the top of the day, with the Gregorian and Hebrew date over it

### Commitments (קבלה על עצמי בלי נדר)
- **Recurrence:** once, daily, weekly, or monthly
- **End condition:** no limit, until a date, or **a number of days** (weeks/months for weekly/monthly) — with a live preview of the end date
- **Day counter** on every occurrence: "יום 5 מתוך 40" (or "שבוע 3", "חודש 2")
- **Done checkbox** ✅ tracked separately for each date
- **Tehillim readings:** either a fixed set of chapters, or **"complete the book"** — the 150 chapters are split as evenly as possible across the commitment's days, and each day shows only its share
- **Reading tracker:** mark each chapter "✓ read"; read chapters collapse, with a daily progress bar and whole-book progress (`37/150`)

### Reminders
- When the app is open in a **background tab** and today has a commitment not yet marked done, a system notification pops up **on every round hour** inside a configurable hour range (default: all day)
- Clicking the notification brings the tab back and opens today
- If the computer was asleep/off over one or more round hours, **a single** catch-up notification shows when it's back — never a burst
- Configured in Settings, including a "send test notification" button

> Browsers don't allow a page to switch itself to the active tab; the switch happens when the notification is clicked (or when you return to the tab yourself).

### Private content
- Marking an entry "keep to myself" locks it behind a password (set the first time you use it); access is remembered per browser session for 4 hours
- **Password update** for private content, with an option to lock immediately from the settings page (`/settings`)

## Prerequisites

- Node.js — the server uses the built-in `node:sqlite` module, so you need Node.js 22.5 or later (on versions before it was fully stabilized you may need the `--experimental-sqlite` flag; Node 23.4+/24+ is recommended)
- npm

## Setup

The project is split into separate `client` and `server` folders, each with its own `package.json`:

```bash
# install server dependencies
cd server
npm install
cp .env.example .env

# install client dependencies
cd ../client
npm install
```

### Environment variables (server)

The server reads these from `server/.env` via `dotenv` (see [`server/.env.example`](server/.env.example)):

| Variable | Default if unset | Description |
|---|---|---|
| `PORT` | `4000` | Port the Express server runs on. **The client's dev proxy expects `4408`**, as set in `.env.example`. |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin (only matters when calling the server directly rather than through the Vite proxy) |

## Running it

Run the server and client in separate terminals.

**Server** (from `server/`):

```bash
npm run dev    # nodemon, auto-restarts on changes
npm start      # plain run
```

The server comes up on `http://localhost:4408` (with the `.env` from the example).

**Client** (from `client/`):

```bash
npm run dev       # Vite dev server on http://localhost:5414
npm run build     # production build into client/dist
npm run preview   # serve the local build to check it
```

Open **http://localhost:5414**. In development, Vite proxies `/api` and `/uploads` to `http://localhost:4408` (see [`client/vite.config.js`](client/vite.config.js)), so the client just hits the API with relative paths. Note that the server doesn't currently serve the client's static build (`client/dist`), so running this in production needs a reverse proxy or separate static hosting for the client.

After pulling code changes, just restart the server — new tables and columns are added automatically.

## Project structure

```
a-day-in-my-life/
├── client/                 # React + Vite frontend
│   └── src/
│       ├── api/            # fetch calls to the API (days, entries, recipes, private, tehillim, settings)
│       ├── components/     # EntryBlock, PhotoGallery, Lightbox, DayCover, Calendar, ReminderSettings ...
│       ├── hooks/          # useDay, useCommitmentReminders, PrivateSessionContext
│       ├── pages/          # DayPage, RecipesPage, SettingsPage
│       ├── recurrence.js   # recurrence helpers (form previews; the server is the source of truth)
│       ├── reminders.js    # reminder timing logic
│       ├── hebrewDate.js   # Hebrew date formatting
│       └── App.jsx
├── server/                 # Node.js + Express backend
│   ├── src/
│   │   ├── routes/         # days, entries, recipes, private, tehillim, settings
│   │   ├── middleware/     # privateSession (temporary token), upload (multer)
│   │   ├── utils/          # recurrence (occurrence math), tehillimPlan (book split)
│   │   ├── db/             # db.js (node:sqlite + migrations) + schema.sql
│   │   └── app.js / server.js
│   ├── data/               # SQLite database — not in git
│   └── uploads/            # uploaded photos — not in git
└── docs/
    └── ARCHITECTURE.md     # data model, API reference, and core logic
```

See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for the data model, full API reference, and how recurrence, the Tehillim split, and reminders work.

## Data & privacy

- The database (`server/data/`), uploaded photos (`server/uploads/`), and `server/.env` are gitignored and never committed.
- **Backup:** copy `server/data/` and `server/uploads/`.
- **Known limitation:** private-content locking is enforced by the API, but photo files under `/uploads` are served without an access check. That's fine for local use; don't expose the server to a network as-is.
