const express = require('express');
const db = require('../db/db');

const router = express.Router();

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const getRemindersStmt = db.prepare(
  'SELECT reminders_enabled AS enabled, reminder_start AS startTime, reminder_end AS endTime FROM app_settings WHERE id = 1'
);

function serializeReminders(row) {
  return { enabled: !!row.enabled, startTime: row.startTime, endTime: row.endTime };
}

// GET /api/settings/reminders -> { enabled, startTime, endTime } (null times = all day)
router.get('/reminders', (req, res) => {
  res.json(serializeReminders(getRemindersStmt.get()));
});

// PUT /api/settings/reminders  { enabled, startTime, endTime }
router.put('/reminders', (req, res) => {
  const { enabled } = req.body;
  const startTime = req.body.startTime || null;
  const endTime = req.body.endTime || null;

  if (!!startTime !== !!endTime) {
    return res.status(400).json({ error: 'יש להגדיר גם שעת התחלה וגם שעת סיום' });
  }
  if ((startTime && !TIME_PATTERN.test(startTime)) || (endTime && !TIME_PATTERN.test(endTime))) {
    return res.status(400).json({ error: 'שעה לא תקינה' });
  }

  db.prepare('UPDATE app_settings SET reminders_enabled = ?, reminder_start = ?, reminder_end = ? WHERE id = 1').run(
    enabled ? 1 : 0,
    startTime,
    endTime
  );
  res.json(serializeReminders(getRemindersStmt.get()));
});

module.exports = router;
