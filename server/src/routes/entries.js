const express = require('express');
const path = require('path');
const db = require('../db/db');
const upload = require('../middleware/upload');
const { VALID_RECURRENCES, nthOccurrenceDate } = require('../utils/recurrence');
const { VALID_TEHILLIM_PLANS } = require('../utils/tehillimPlan');

const router = express.Router();

const VALID_TYPES = ['photo', 'note', 'thought', 'recipe', 'commitment', 'plan', 'dream', 'other'];

function normalizeUrl(rawUrl) {
  const value = (rawUrl || '').trim();
  if (!value) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
  if (!/^https?:\/\//i.test(withScheme)) {
    throw Object.assign(new Error('רק קישורי http/https נתמכים'), { status: 400 });
  }
  return withScheme;
}

const MAX_RECURRENCE_COUNT = 10000;

function parseRecurrenceCount(rawValue) {
  if (rawValue === undefined || rawValue === null || rawValue === '') return null;
  const count = Number(rawValue);
  if (!Number.isInteger(count) || count < 1 || count > MAX_RECURRENCE_COUNT) {
    throw Object.assign(new Error('מספר הימים חייב להיות מספר שלם חיובי'), { status: 400 });
  }
  return count;
}

function resolveRecurrence(type, date, body) {
  const none = { recurrence: null, recurrenceUntil: null, recurrenceCount: null };
  if (type !== 'commitment') return none;

  const recurrence = VALID_RECURRENCES.includes(body.recurrence) ? body.recurrence : 'daily';
  if (recurrence === 'once') return { ...none, recurrence };

  const recurrenceCount = parseRecurrenceCount(body.recurrenceCount);
  if (recurrenceCount) {
    return { recurrence, recurrenceCount, recurrenceUntil: nthOccurrenceDate(date, recurrence, recurrenceCount) };
  }

  const recurrenceUntil = body.recurrenceUntil || null;
  if (recurrenceUntil && recurrenceUntil < date) {
    throw Object.assign(new Error('"עד תאריך" לא יכול להיות לפני תאריך ההתחלה'), { status: 400 });
  }
  return { recurrence, recurrenceUntil, recurrenceCount: null };
}

function resolveTehillimChapters(type, rawValue) {
  if (type !== 'commitment' || !rawValue) return null;

  let chapters;
  try {
    chapters = JSON.parse(rawValue);
  } catch {
    throw Object.assign(new Error('פרקי תהילים לא תקינים'), { status: 400 });
  }
  if (!Array.isArray(chapters)) {
    throw Object.assign(new Error('פרקי תהילים לא תקינים'), { status: 400 });
  }

  const cleaned = [...new Set(chapters.map(Number))].sort((a, b) => a - b);
  if (cleaned.some((n) => !Number.isInteger(n) || n < 1 || n > 150)) {
    throw Object.assign(new Error('פרק תהילים חייב להיות בין 1 ל-150'), { status: 400 });
  }
  return cleaned.length ? JSON.stringify(cleaned) : null;
}

// Splitting the book needs a known number of days, so an open-ended commitment can't use it.
function resolveTehillimPlan(type, rawPlan, recurrence, recurrenceUntil) {
  if (type !== 'commitment' || !rawPlan) return null;
  if (!VALID_TEHILLIM_PLANS.includes(rawPlan)) {
    throw Object.assign(new Error('תוכנית תהילים לא תקינה'), { status: 400 });
  }
  if (recurrence !== 'once' && !recurrenceUntil) {
    throw Object.assign(new Error('כדי לחלק את ספר תהילים צריך להגדיר מספר ימים או תאריך סיום'), { status: 400 });
  }
  return rawPlan;
}

const insertEntryStmt = db.prepare(
  `INSERT INTO entries (date, type, title, text, url, recurrence, recurrence_until, recurrence_count, tehillim_chapters, tehillim_plan, is_private, order_index)
   VALUES (@date, @type, @title, @text, @url, @recurrence, @recurrenceUntil, @recurrenceCount, @tehillimChapters, @tehillimPlan, @isPrivate, @orderIndex)`
);
const insertPhotoStmt = db.prepare(
  `INSERT INTO entry_photos (entry_id, file_path, caption, order_index) VALUES (?, ?, ?, ?)`
);
const maxOrderStmt = db.prepare('SELECT COALESCE(MAX(order_index), -1) AS maxOrder FROM entries WHERE date = ?');

// POST /api/entries  (multipart/form-data, field "photos" for images)
router.post('/', upload.array('photos', 20), (req, res) => {
  const { date, type, title, text } = req.body;
  const isPrivate = req.body.isPrivate === 'true' || req.body.isPrivate === true;
  const captions = req.body.captions ? JSON.parse(req.body.captions) : [];

  if (!date || !VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: 'תאריך או סוג פריט לא תקינים' });
  }

  let url;
  let recurrence;
  let recurrenceUntil;
  let recurrenceCount;
  let tehillimChapters;
  let tehillimPlan;
  try {
    url = normalizeUrl(req.body.url);
    ({ recurrence, recurrenceUntil, recurrenceCount } = resolveRecurrence(type, date, req.body));
    tehillimPlan = resolveTehillimPlan(type, req.body.tehillimPlan, recurrence, recurrenceUntil);
    tehillimChapters = tehillimPlan ? null : resolveTehillimChapters(type, req.body.tehillimChapters);
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message });
  }

  const orderIndex = maxOrderStmt.get(date).maxOrder + 1;

  db.exec('BEGIN');
  try {
    const info = insertEntryStmt.run({
      date,
      type,
      title: title || null,
      text: text || null,
      url,
      recurrence,
      recurrenceUntil,
      recurrenceCount,
      tehillimChapters,
      tehillimPlan,
      isPrivate: isPrivate ? 1 : 0,
      orderIndex,
    });
    const entryId = info.lastInsertRowid;

    (req.files || []).forEach((file, i) => {
      const relativePath = path.posix.join(date, file.filename);
      insertPhotoStmt.run(entryId, relativePath, captions[i] || null, i);
    });

    db.exec('COMMIT');
    res.status(201).json({ id: Number(entryId) });
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
});

// PUT /api/entries/:id
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, text, isPrivate, recurrence, recurrenceUntil } = req.body;
  const existing = db.prepare('SELECT * FROM entries WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'הפריט לא נמצא' });

  let url = existing.url;
  if (req.body.url !== undefined) {
    try {
      url = normalizeUrl(req.body.url);
    } catch (err) {
      return res.status(err.status || 400).json({ error: err.message });
    }
  }

  let nextRecurrence = existing.recurrence;
  let nextRecurrenceUntil = existing.recurrence_until;
  let nextRecurrenceCount = existing.recurrence_count;
  let nextTehillimChapters = existing.tehillim_chapters;
  let nextTehillimPlan = existing.tehillim_plan;
  if (existing.type === 'commitment') {
    if (recurrence !== undefined) {
      if (!VALID_RECURRENCES.includes(recurrence)) {
        return res.status(400).json({ error: 'תדירות לא תקינה' });
      }
      nextRecurrence = recurrence;
    }
    if (req.body.recurrenceCount !== undefined) {
      try {
        nextRecurrenceCount = parseRecurrenceCount(req.body.recurrenceCount);
      } catch (err) {
        return res.status(err.status || 400).json({ error: err.message });
      }
    }
    if (recurrenceUntil !== undefined) {
      nextRecurrenceUntil = recurrenceUntil || null;
      if (nextRecurrenceUntil && nextRecurrenceUntil < existing.date) {
        return res.status(400).json({ error: '"עד תאריך" לא יכול להיות לפני תאריך ההתחלה' });
      }
    }

    if (nextRecurrence === 'once') {
      nextRecurrenceUntil = null;
      nextRecurrenceCount = null;
    } else if (nextRecurrenceCount) {
      nextRecurrenceUntil = nthOccurrenceDate(existing.date, nextRecurrence, nextRecurrenceCount);
    }
    if (req.body.tehillimChapters !== undefined) {
      try {
        nextTehillimChapters = resolveTehillimChapters('commitment', req.body.tehillimChapters);
      } catch (err) {
        return res.status(err.status || 400).json({ error: err.message });
      }
    }
    try {
      nextTehillimPlan = resolveTehillimPlan(
        'commitment',
        req.body.tehillimPlan !== undefined ? req.body.tehillimPlan : existing.tehillim_plan,
        nextRecurrence,
        nextRecurrenceUntil
      );
    } catch (err) {
      return res.status(err.status || 400).json({ error: err.message });
    }
    if (nextTehillimPlan) nextTehillimChapters = null;
  }

  db.prepare(
    `UPDATE entries SET title = ?, text = ?, url = ?, recurrence = ?, recurrence_until = ?, recurrence_count = ?, tehillim_chapters = ?, tehillim_plan = ?, is_private = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(
    title !== undefined ? title : existing.title,
    text !== undefined ? text : existing.text,
    url,
    nextRecurrence,
    nextRecurrenceUntil,
    nextRecurrenceCount,
    nextTehillimChapters,
    nextTehillimPlan,
    isPrivate !== undefined ? (isPrivate ? 1 : 0) : existing.is_private,
    id
  );
  res.json({ ok: true });
});

// POST /api/entries/:id/toggle-complete  { date } -> toggles completion for that specific date
router.post('/:id/toggle-complete', (req, res) => {
  const { id } = req.params;
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'חסר תאריך' });

  const existing = db.prepare('SELECT id, type FROM entries WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'הפריט לא נמצא' });
  if (existing.type !== 'commitment') {
    return res.status(400).json({ error: 'ניתן לסמן ביצוע רק עבור קבלות על עצמי' });
  }

  const already = db.prepare('SELECT id FROM entry_completions WHERE entry_id = ? AND date = ?').get(id, date);
  if (already) {
    db.prepare('DELETE FROM entry_completions WHERE id = ?').run(already.id);
    return res.json({ completed: false });
  }
  db.prepare('INSERT INTO entry_completions (entry_id, date) VALUES (?, ?)').run(id, date);
  res.json({ completed: true });
});

// POST /api/entries/:id/tehillim-read  { date, chapter } -> toggles whether a chapter was read on that date
router.post('/:id/tehillim-read', (req, res) => {
  const { id } = req.params;
  const { date } = req.body;
  const chapter = Number(req.body.chapter);
  if (!date) return res.status(400).json({ error: 'חסר תאריך' });
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > 150) {
    return res.status(400).json({ error: 'פרק תהילים חייב להיות בין 1 ל-150' });
  }

  const existing = db.prepare('SELECT id, type FROM entries WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'הפריט לא נמצא' });
  if (existing.type !== 'commitment') {
    return res.status(400).json({ error: 'ניתן לסמן קריאת תהילים רק עבור קבלות על עצמי' });
  }

  const deleted = db
    .prepare('DELETE FROM tehillim_reads WHERE entry_id = ? AND date = ? AND chapter = ?')
    .run(id, date, chapter);
  if (deleted.changes) return res.json({ read: false });
  db.prepare('INSERT INTO tehillim_reads (entry_id, date, chapter) VALUES (?, ?, ?)').run(id, date, chapter);
  res.json({ read: true });
});

// DELETE /api/entries/:id
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM entries WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'הפריט לא נמצא' });
  db.prepare('DELETE FROM entries WHERE id = ?').run(id);
  res.json({ ok: true });
});

module.exports = router;
