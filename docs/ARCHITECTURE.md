# Architecture — A Day in My Life

The data model, the API, and the core logic that isn't obvious from reading the code.

---

## Data model (SQLite)

The schema lives in [server/src/db/schema.sql](../server/src/db/schema.sql). Columns added after a table was first created are migrated in [db.js](../server/src/db/db.js) with `ALTER TABLE`, automatically on server startup.

| Table | Purpose |
|---|---|
| `entries` | Every journal entry. `date` = the day it was created / the commitment's start date. |
| `entry_photos` | An entry's photos (`file_path` is relative to `server/uploads/`). |
| `entry_completions` | ✅ for a commitment **on a specific date** (`UNIQUE(entry_id, date)`). |
| `tehillim_reads` | A Tehillim chapter marked read for a commitment on a date (`UNIQUE(entry_id, date, chapter)`). |
| `day_covers` | The cover photo per date (`date` PK → `entry_photos.id`). |
| `app_settings` | Single row (`id = 1`): private-content password hash + reminder settings. |

All dependent tables use `ON DELETE CASCADE` — deleting an entry removes its photos, completions, reads, and any day cover pointing at it.

### Commitment columns on `entries` (`type = 'commitment'`)

| Column | Values |
|---|---|
| `recurrence` | `once` / `daily` / `weekly` / `monthly` |
| `recurrence_until` | Date of the last occurrence (`YYYY-MM-DD`), or `NULL` = no end |
| `recurrence_count` | Number of occurrences, when the end was set as "number of days". It's the **source of truth** in that case — the server derives `recurrence_until` from it. |
| `tehillim_chapters` | JSON array of fixed chapters, e.g. `[1, 23, 121]` |
| `tehillim_plan` | `complete` = finish the whole book, or `NULL` |

---

## API

All routes are under `/api`. Requests may carry `X-Private-Token` for access to private content (see [privateSession.js](../server/src/middleware/privateSession.js)); without it, private entries come back as `{ locked: true }` with no content.

### Days — [routes/days.js](../server/src/routes/days.js)

| Method | Path | Description |
|---|---|---|
| `GET` | `/days/:date` | The day's entries + recurring commitments that land on it + `cover` |
| `GET` | `/days/summary/month?month=YYYY-MM` | Dates in the month that have entries (calendar dots) |
| `GET` | `/days/:date/pending-commitments` | `{ count }` of active commitments not marked ✅ (includes private ones, count only) |
| `PUT` | `/days/:date/cover` | `{ photoId }` — set the day's cover (the photo must belong to that day) |
| `DELETE` | `/days/:date/cover` | Remove the day's cover |

Derived fields returned for commitments by `GET /days/:date`:

| Field | Meaning |
|---|---|
| `occurrenceNumber` / `occurrenceTotal` | "Day 5 of 40" (`total` absent when open-ended) |
| `completed` | Whether it's marked ✅ **on the displayed date** |
| `tehillimToday` | Chapters to read today (the fixed set, or today's share of the book) |
| `tehillimReadToday` | Chapters marked read today |
| `tehillimBookChaptersRead` | Distinct chapters read across all days (only for `complete`) |

### Entries — [routes/entries.js](../server/src/routes/entries.js)

| Method | Path | Description |
|---|---|---|
| `POST` | `/entries` | Create (`multipart/form-data`, photos in the `photos` field) |
| `PUT` | `/entries/:id` | Update (JSON, partial fields) |
| `DELETE` | `/entries/:id` | Delete (for a recurring commitment, the whole series) |
| `POST` | `/entries/:id/toggle-complete` | `{ date }` — toggle ✅ for that date |
| `POST` | `/entries/:id/tehillim-read` | `{ date, chapter }` — toggle a chapter as read |

### Other

| Method | Path | Description |
|---|---|---|
| `GET` | `/tehillim/:chapter` | Chapter text from Sefaria (in-memory cache) |
| `GET` / `PUT` | `/settings/reminders` | `{ enabled, startTime, endTime }` — `null` times = all day |
| `GET` | `/recipes` | Every recipe entry across all dates |
| `GET` | `/private/status` | Whether a password has been set |
| `POST` | `/private/setup` · `/private/unlock` · `/private/change` | Password management; `unlock` returns a token (valid 4 hours, held in server memory) |

---

## Core logic

### Recurring commitments — [utils/recurrence.js](../server/src/utils/recurrence.js)

A commitment is stored **once**, on its start date. `GET /days/:date` looks up commitments from earlier dates and uses `matchesRecurrence` to decide whether each one lands on the requested day.

- **Monthly:** if the start day doesn't exist in a month (e.g. the 31st), that month's occurrence falls on its last day.
- `occurrenceIndex(origin, recurrence, date)` — 1-based occurrence number; drives the day counter and the Tehillim split.
- `nthOccurrenceDate(origin, recurrence, n)` — date of the n-th occurrence; converts "number of days" into `recurrence_until`.

[client/src/recurrence.js](../client/src/recurrence.js) mirrors these **for form previews only**; the server is the source of truth.

### Splitting the book of Tehillim — [utils/tehillimPlan.js](../server/src/utils/tehillimPlan.js)

The 150 chapters are split into N consecutive days: each day gets `⌊150/N⌋` chapters, and the first `150 mod N` days get one more. With more than 150 days, each day gets one chapter and the extra days get none.

- The split is **by chapter count, not length** — the day that includes Psalm 119 (176 verses) is noticeably longer.
- `complete` needs a known number of occurrences (`recurrence_until`, or `once`); the server rejects it on an open-ended commitment.

### Reminders — [reminders.js](../client/src/reminders.js) + [useCommitmentReminders.js](../client/src/hooks/useCommitmentReminders.js)

Reminders run **in the browser**, not on the server. A check runs every minute (background tabs are throttled to about that anyway). A notification is sent when:

1. Reminders are enabled, `Notification` permission is granted, and the tab is **hidden** (`document.hidden`);
2. `isReminderDue` returns `true`:
   - **On time:** within the first 10 minutes of a round hour that falls inside the range; **or**
   - **Catch-up:** a gap of 3+ minutes since the previous check (sleep / browser closed) that spans a round hour inside the range, **today**;
   - and in either case at least **45 minutes** have passed since the last reminder — so after a long shutdown exactly one reminder shows, not another one right away on the next round hour;
3. The server reports at least one commitment not marked ✅.

`lastCheckAt` and `lastReminderAt` live in `localStorage` (shared by all tabs, and they survive the browser being closed), and the decision runs under `navigator.locks` so several open tabs can't send duplicate reminders.

**Browser limitation:** a page can't make itself the active tab. The switch happens only when the notification is clicked (`window.focus()` is allowed there), or when the user returns to the tab — the app then navigates to today.
