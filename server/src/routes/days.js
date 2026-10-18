const express = require('express');
const db = require('../db/db');
const { matchesRecurrence, occurrenceIndex } = require('../utils/recurrence');
const { chaptersForDay } = require('../utils/tehillimPlan');

const router = express.Router();

const getPhotosStmt = db.prepare(
  'SELECT id, file_path AS filePath, caption, order_index AS orderIndex FROM entry_photos WHERE entry_id = ? ORDER BY order_index ASC'
);
const isCompletedStmt = db.prepare('SELECT 1 FROM entry_completions WHERE entry_id = ? AND date = ?');
const readChaptersStmt = db.prepare('SELECT chapter FROM tehillim_reads WHERE entry_id = ? AND date = ?');
const bookProgressStmt = db.prepare('SELECT COUNT(DISTINCT chapter) AS n FROM tehillim_reads WHERE entry_id = ?');

function serializeEntry(row, hasPrivateAccess, extra = {}) {
  const isPrivate = !!row.is_private;
  if (isPrivate && !hasPrivateAccess) {
    return {
      id: row.id,
      date: row.date,
      type: row.type,
      isPrivate: true,
      locked: true,
      orderIndex: row.order_index,
      createdAt: row.created_at,
      ...extra,
    };
  }
  const displayDate = extra.date || row.date;
  const isRecurringCommitment = row.type === 'commitment' && row.recurrence && row.recurrence !== 'once';
  const occurrenceNumber = isRecurringCommitment ? occurrenceIndex(row.date, row.recurrence, displayDate) : 1;
  const occurrenceTotal = !isRecurringCommitment
    ? 1
    : row.recurrence_until
      ? occurrenceIndex(row.date, row.recurrence, row.recurrence_until)
      : null;
  const tehillimChapters = row.tehillim_chapters ? JSON.parse(row.tehillim_chapters) : [];
  return {
    id: row.id,
    date: row.date,
    type: row.type,
    title: row.title,
    text: row.text,
    url: row.url,
    recurrence: row.recurrence,
    recurrenceUntil: row.recurrence_until,
    recurrenceCount: row.recurrence_count,
    occurrenceNumber: isRecurringCommitment ? occurrenceNumber : undefined,
    occurrenceTotal: isRecurringCommitment ? occurrenceTotal ?? undefined : undefined,
    tehillimChapters,
    tehillimPlan: row.tehillim_plan,
    tehillimToday:
      row.tehillim_plan === 'complete' ? chaptersForDay(occurrenceNumber, occurrenceTotal) : tehillimChapters,
    tehillimReadToday:
      row.type === 'commitment' ? readChaptersStmt.all(row.id, displayDate).map((r) => r.chapter) : undefined,
    tehillimBookChaptersRead: row.tehillim_plan === 'complete' ? bookProgressStmt.get(row.id).n : undefined,
    completed: row.type === 'commitment' ? !!isCompletedStmt.get(row.id, displayDate) : undefined,
    isPrivate,
    locked: false,
    orderIndex: row.order_index,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    photos: getPhotosStmt.all(row.id),
    ...extra,
  };
}

const recurringCommitmentsStmt = db.prepare(
  `SELECT * FROM entries
   WHERE type = 'commitment' AND recurrence IS NOT NULL AND recurrence != 'once' AND date < ?
     AND (recurrence_until IS NULL OR recurrence_until >= ?)
   ORDER BY date ASC`
);

// GET /api/days/:date -> all entries for a day (private entries locked unless hasPrivateAccess),
// plus recurring commitments carried forward from earlier dates.
router.get('/:date', (req, res) => {
  const { date } = req.params;
  const rows = db
    .prepare('SELECT * FROM entries WHERE date = ? ORDER BY order_index ASC, created_at ASC')
    .all(date);
  const entries = rows.map((row) => serializeEntry(row, req.hasPrivateAccess));

  const recurringRows = recurringCommitmentsStmt.all(date, date);
  const recurringEntries = recurringRows
    .filter((row) => matchesRecurrence(row.date, row.recurrence, date, row.recurrence_until))
    .map((row) => serializeEntry(row, req.hasPrivateAccess, { recurring: true, originDate: row.date, date }));

  res.json({ date, entries: [...entries, ...recurringEntries], cover: getCover(date, req.hasPrivateAccess) });
});

const directCommitmentsStmt = db.prepare("SELECT id FROM entries WHERE type = 'commitment' AND date = ?");

// GET /api/days/:date/pending-commitments -> { count } of commitments active that day and not yet
// marked done. Only a count is returned, so private commitments are included without leaking content.
router.get('/:date/pending-commitments', (req, res) => {
  const { date } = req.params;
  const directIds = directCommitmentsStmt.all(date).map((r) => r.id);
  const recurringIds = recurringCommitmentsStmt
    .all(date, date)
    .filter((row) => matchesRecurrence(row.date, row.recurrence, date, row.recurrence_until))
    .map((row) => row.id);

  const count = [...directIds, ...recurringIds].filter((id) => !isCompletedStmt.get(id, date)).length;
  res.json({ count });
});

const coverStmt = db.prepare(
  `SELECT p.id AS photoId, p.file_path AS filePath, p.caption, e.is_private AS isPrivate
   FROM day_covers c
   JOIN entry_photos p ON p.id = c.photo_id
   JOIN entries e ON e.id = p.entry_id
   WHERE c.date = ?`
);

function getCover(date, hasPrivateAccess) {
  const row = coverStmt.get(date);
  if (!row || (row.isPrivate && !hasPrivateAccess)) return null;
  return { photoId: row.photoId, filePath: row.filePath, caption: row.caption };
}

const photoOnDateStmt = db.prepare(
  `SELECT e.is_private AS isPrivate FROM entry_photos p
   JOIN entries e ON e.id = p.entry_id
   WHERE p.id = ? AND e.date = ?`
);

// PUT /api/days/:date/cover  { photoId } -> sets the day's cover photo (must belong to that day)
router.put('/:date/cover', (req, res) => {
  const { date } = req.params;
  const photoId = Number(req.body.photoId);
  const photo = photoOnDateStmt.get(photoId, date);
  if (!photo) return res.status(400).json({ error: 'התמונה לא שייכת ליום הזה' });
  if (photo.isPrivate && !req.hasPrivateAccess) return res.status(403).json({ error: 'אין גישה לתמונה פרטית' });

  db.prepare(
    'INSERT INTO day_covers (date, photo_id) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET photo_id = excluded.photo_id'
  ).run(date, photoId);
  res.json({ ok: true });
});

// DELETE /api/days/:date/cover
router.delete('/:date/cover', (req, res) => {
  db.prepare('DELETE FROM day_covers WHERE date = ?').run(req.params.date);
  res.json({ ok: true });
});

const monthRecurringCandidatesStmt = db.prepare(
  `SELECT date, recurrence, recurrence_until FROM entries
   WHERE type = 'commitment' AND recurrence IS NOT NULL AND recurrence != 'once' AND date <= ?
     AND (recurrence_until IS NULL OR recurrence_until >= ?)`
);

// GET /api/days/summary?month=YYYY-MM -> which dates in the month have entries
// (including dates that only carry a recurring commitment forward)
router.get('/summary/month', (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ error: 'חסר פרמטר month (YYYY-MM)' });

  const directRows = db.prepare("SELECT DISTINCT date FROM entries WHERE date LIKE ? || '%'").all(month);
  const dates = new Set(directRows.map((r) => r.date));

  const [year, monthNum] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, monthNum, 0)).getUTCDate();
  const firstOfMonth = `${month}-01`;
  const lastOfMonth = `${month}-${String(lastDay).padStart(2, '0')}`;
  const candidates = monthRecurringCandidatesStmt.all(lastOfMonth, firstOfMonth);

  for (let day = 1; day <= lastDay; day++) {
    const dateStr = `${month}-${String(day).padStart(2, '0')}`;
    if (dates.has(dateStr)) continue;
    if (candidates.some((c) => matchesRecurrence(c.date, c.recurrence, dateStr, c.recurrence_until))) {
      dates.add(dateStr);
    }
  }

  res.json({ dates: Array.from(dates).sort() });
});

module.exports = router;
