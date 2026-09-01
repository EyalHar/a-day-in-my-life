# A Day in My Life (יום בחיי)

A personal daily journal app. For any given date you can add entries of different types — a photo, free writing, a thought, a recipe, a habit you're committing to, a plan, a dream, or "other" — and browse between days with a monthly calendar. Entries can be marked "private," which locks them behind a separate password, and habit-type entries support recurrence (daily, weekly, etc.), so they keep showing up on future days until an optional target date.

## Tech stack

- **Frontend:** React 18 (function components + hooks), React Router v7, TanStack Query (React Query) v5, Vite, date-fns
- **Backend:** Node.js + Express 4
- **Database:** SQLite via the built-in `node:sqlite` module (`DatabaseSync`) — no external DB dependency, the file is created automatically under `server/data/`
- **Files:** image uploads handled with Multer, stored under `server/uploads/`
- **Security:** the private-content password is hashed with bcryptjs, access is granted via a temporary token (in-memory sessions)

## Main features

- **Daily feed by date** (`/day/:date`) for adding entries of different types: photo 📷, writing ✍️, thought 💭, recipe 🍲, habit 🌱, plan 🗺️, dream 🌙, other ✨
- **Monthly calendar** opens from the feed, shows a dot on days that have content, and lets you jump between days
- **Recipes page** (`/recipes`) — pulls together every "recipe" entry from every date in one place
- **Multiple photos per entry**, each with its own caption
- **Optional URL link** on any entry
- **Private content** — marking an entry "keep to myself" locks it behind a password (set the first time you use it); access is remembered per browser session for 4 hours
- **Password update** for private content, with an option to lock immediately from the settings page (`/settings`)
- **Recurring habits** — a habit-type entry can repeat (daily, etc.) until a target date, and shows up automatically on future days in both the feed and the calendar without a separate record being created for each day

## Prerequisites

- Node.js — the server uses the built-in `node:sqlite` module, so you need Node.js 22.5 or later (on versions before it was fully stabilized you may need the `--experimental-sqlite` flag; Node 23.4+/24+ is recommended)
- npm

## Setup

The project is split into separate `client` and `server` folders, each with its own `package.json`:

```bash
# install server dependencies
cd server
npm install

# install client dependencies
cd ../client
npm install
```

### Environment variables (server)

There's no `.env.example` file in the repo yet. The server reads the following variables (with defaults if unset) via `dotenv`, from `server/.env`:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | Port the Express server runs on |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin (the client's URL) |

## Running it

Run the server and client in separate terminals.

**Server** (from `server/`):

```bash
npm run dev    # nodemon, auto-restarts on changes
npm start      # plain run
```

The server comes up on `http://localhost:4000` by default.

**Client** (from `client/`):

```bash
npm run dev       # Vite dev server on http://localhost:5173
npm run build     # production build into client/dist
npm run preview   # serve the local build to check it
```

In development, Vite is configured to proxy `/api` and `/uploads` to `http://localhost:4000` (see `client/vite.config.js`), so the client just hits the API with relative paths. Note that the server doesn't currently serve the client's static build (`client/dist`), so running this in production needs a reverse proxy or separate static hosting for the client.

## Project structure

```
a-day-in-my-life/
├── client/                 # React + Vite frontend
│   └── src/
│       ├── api/            # fetch calls to the API (days, entries, recipes, private)
│       ├── components/     # Calendar, EntryBlock, AddEntryMenu, Sidebar, PrivateLock ...
│       ├── hooks/          # useDay, PrivateSessionContext
│       ├── pages/          # DayPage, RecipesPage, SettingsPage
│       └── App.jsx
└── server/                 # Node.js + Express backend
    └── src/
        ├── routes/         # days, entries, recipes, private
        ├── middleware/     # privateSession (temporary token), upload (multer)
        ├── db/              # db.js (node:sqlite) + schema.sql
        └── app.js / server.js
```
