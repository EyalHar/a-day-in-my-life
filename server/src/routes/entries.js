const express = require('express');
const path = require('path');
const db = require('../db/db');
const upload = require('../middleware/upload');
const { VALID_RECURRENCES } = require('../utils/recurrence');

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

function resolveRecurrence(type, date, body) {
  if (type !== 'commitment') return { recurrence: null, recurrenceUntil: null };

  const recurrence = VALID_RECURRENCES.includes(body.recurrence) ? body.recurrence : 'daily';
  const recurrenceUntil = body.recurrenceUntil || null;
  if (recurrenceUntil && recurrenceUntil < date) {
    throw Object.assign(new Error('"עד תאריך" לא יכול להיות לפני תאריך ההתחלה'), { status: 400 });
  }
  return { recurrence, recurrenceUntil };
}

const insertEntryStmt = db.prepare(
  `INSERT INTO entries (date, type, title, text, url, recurrence, recurrence_until, is_private, order_index)
   VALUES (@date, @type, @title, @text, @url, @recurrence, @recurrenceUntil, @isPrivate, @orderIndex)`
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
  try {
    url = normalizeUrl(req.body.url);
    ({ recurrence, recurrenceUntil } = resolveRecurrence(type, date, req.body));
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
  if (existing.type === 'commitment') {
    if (recurrence !== undefined) {
      if (!VALID_RECURRENCES.includes(recurrence)) {
        return res.status(400).json({ error: 'תדירות לא תקינה' });
      }
      nextRecurrence = recurrence;
    }
    if (recurrenceUntil !== undefined) {
      nextRecurrenceUntil = recurrenceUntil || null;
      if (nextRecurrenceUntil && nextRecurrenceUntil < existing.date) {
        return res.status(400).json({ error: '"עד תאריך" לא יכול להיות לפני תאריך ההתחלה' });
      }
    }
  }

  db.prepare(
    `UPDATE entries SET title = ?, text = ?, url = ?, recurrence = ?, recurrence_until = ?, is_private = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(
    title !== undefined ? title : existing.title,
    text !== undefined ? text : existing.text,
    url,
    nextRecurrence,
    nextRecurrenceUntil,
    isPrivate !== undefined ? (isPrivate ? 1 : 0) : existing.is_private,
    id
  );
  res.json({ ok: true });
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
