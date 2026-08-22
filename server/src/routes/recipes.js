const express = require('express');
const db = require('../db/db');

const router = express.Router();

const getPhotosStmt = db.prepare(
  'SELECT id, file_path AS filePath, caption FROM entry_photos WHERE entry_id = ? ORDER BY order_index ASC'
);

// GET /api/recipes -> all recipe-type entries across every date (locked if private + no access)
router.get('/', (req, res) => {
  const rows = db.prepare("SELECT * FROM entries WHERE type = 'recipe' ORDER BY date DESC").all();
  const recipes = rows.map((row) => {
    if (row.is_private && !req.hasPrivateAccess) {
      return { id: row.id, date: row.date, type: 'recipe', locked: true };
    }
    return {
      id: row.id,
      date: row.date,
      type: 'recipe',
      title: row.title,
      text: row.text,
      url: row.url,
      isPrivate: !!row.is_private,
      locked: false,
      photos: getPhotosStmt.all(row.id),
    };
  });
  res.json({ recipes });
});

module.exports = router;
