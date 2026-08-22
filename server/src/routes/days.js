const express = require('express');
const db = require('../db/db');
const { matchesRecurrence } = require('../utils/recurrence');

const router = express.Router();

const getPhotosStmt = db.prepare(
  'SELECT id, file_path AS filePath, caption, order_index AS orderIndex FROM entry_photos WHERE entry_id = ? ORDER BY order_index ASC'
);

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
  return {
    id: row.id,
    date: row.date,
    type: row.type,
    title: row.title,
    text: row.text,
    url: row.url,
    recurrence: row.recurrence,
    recurrenceUntil: row.recurrence_until,
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
   WHERE type = 'commitment' AND recurrence IS NOT NULL AND date < ?
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
    .filter((row) => matchesRecurrence(row.date, row.recurrence, date))
    .map((row) => serializeEntry(row, req.hasPrivateAccess, { recurring: true, originDate: row.date, date }));

  res.json({ date, entries: [...entries, ...recurringEntries] });
});

const monthRecurringCandidatesStmt = db.prepare(
  `SELECT date, recurrence, recurrence_until FROM entries
   WHERE type = 'commitment' AND recurrence IS NOT NULL AND date <= ?
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
    if (candidates.some((c) => matchesRecurrence(c.date, c.recurrence, dateStr))) dates.add(dateStr);
  }

  res.json({ dates: Array.from(dates).sort() });
});

module.exports = router;
