const express = require('express');

const router = express.Router();

// In-memory cache: Tehillim text is static, no need to hit Sefaria more than once per chapter.
const cache = new Map();

const NAMED_ENTITIES = {
  thinsp: ' ',
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  rlm: '‏',
  lrm: '‎',
};

function decodeEntities(value) {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === '#') {
      const code =
        entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

function stripHtml(value) {
  return decodeEntities(value.replace(/<[^>]*>/g, '')).trim();
}

// GET /api/tehillim/:chapter -> { chapter, heRef, verses: [...] } (Sefaria's Hebrew text)
router.get('/:chapter', async (req, res) => {
  const chapter = Number(req.params.chapter);
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > 150) {
    return res.status(400).json({ error: 'פרק תהילים חייב להיות בין 1 ל-150' });
  }

  if (cache.has(chapter)) {
    return res.json(cache.get(chapter));
  }

  try {
    const response = await fetch(`https://www.sefaria.org/api/texts/Psalms.${chapter}?context=0`);
    if (!response.ok) {
      throw new Error(`Sefaria responded with ${response.status}`);
    }
    const data = await response.json();
    const heVerses = Array.isArray(data.he) ? data.he : [data.he].filter(Boolean);
    const result = {
      chapter,
      heRef: data.heRef || `תהילים ${chapter}`,
      verses: heVerses.map(stripHtml),
    };
    cache.set(chapter, result);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: 'שגיאה בטעינת הפרק מ-Sefaria' });
  }
});

module.exports = router;
