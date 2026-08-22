const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/db');
const { createSession } = require('../middleware/privateSession');

const router = express.Router();

// GET /api/private/status -> whether a password has been set up yet
router.get('/status', (req, res) => {
  const settings = db.prepare('SELECT private_password_hash AS hash FROM app_settings WHERE id = 1').get();
  res.json({ isConfigured: !!settings.hash });
});

// POST /api/private/setup  { password }  -- only allowed once
router.post('/setup', async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 4) {
    return res.status(400).json({ error: 'סיסמה חייבת להכיל לפחות 4 תווים' });
  }
  const settings = db.prepare('SELECT private_password_hash AS hash FROM app_settings WHERE id = 1').get();
  if (settings.hash) return res.status(409).json({ error: 'סיסמה כבר מוגדרת' });

  const hash = await bcrypt.hash(password, 10);
  db.prepare('UPDATE app_settings SET private_password_hash = ? WHERE id = 1').run(hash);
  res.status(201).json({ ok: true });
});

// POST /api/private/unlock  { password }
router.post('/unlock', async (req, res) => {
  const { password } = req.body;
  const settings = db.prepare('SELECT private_password_hash AS hash FROM app_settings WHERE id = 1').get();
  if (!settings.hash) return res.status(409).json({ error: 'סיסמה עדיין לא הוגדרה' });

  const isMatch = await bcrypt.compare(password || '', settings.hash);
  if (!isMatch) return res.status(401).json({ error: 'סיסמה שגויה' });

  const token = createSession();
  res.json({ token });
});

// POST /api/private/change  { currentPassword, newPassword }
router.post('/change', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'סיסמה חדשה חייבת להכיל לפחות 4 תווים' });
  }
  const settings = db.prepare('SELECT private_password_hash AS hash FROM app_settings WHERE id = 1').get();
  if (!settings.hash) return res.status(409).json({ error: 'סיסמה עדיין לא הוגדרה' });

  const isMatch = await bcrypt.compare(currentPassword || '', settings.hash);
  if (!isMatch) return res.status(401).json({ error: 'סיסמה נוכחית שגויה' });

  const hash = await bcrypt.hash(newPassword, 10);
  db.prepare('UPDATE app_settings SET private_password_hash = ? WHERE id = 1').run(hash);
  res.json({ ok: true });
});

module.exports = router;
