const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const date = req.body.date || 'misc';
    const dir = path.join(uploadsRoot, date);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('רק קבצי תמונה מותרים'));
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: 15 * 1024 * 1024 } });
