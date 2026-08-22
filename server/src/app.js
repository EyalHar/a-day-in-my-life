const express = require('express');
const cors = require('cors');
const path = require('path');

const { attachPrivateAccess } = require('./middleware/privateSession');
const daysRouter = require('./routes/days');
const entriesRouter = require('./routes/entries');
const privateRouter = require('./routes/private');
const recipesRouter = require('./routes/recipes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.use(attachPrivateAccess);

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/days', daysRouter);
app.use('/api/entries', entriesRouter);
app.use('/api/private', privateRouter);
app.use('/api/recipes', recipesRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'שגיאת שרת' });
});

module.exports = app;
