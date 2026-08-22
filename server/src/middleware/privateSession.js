const crypto = require('crypto');

const SESSION_TTL_MS = 1000 * 60 * 60 * 4; // 4 hours
const sessions = new Map(); // token -> expiresAt

function createSession() {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

function isValidToken(token) {
  if (!token) return false;
  const expiresAt = sessions.get(token);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function getTokenFromRequest(req) {
  const header = req.headers['x-private-token'];
  return typeof header === 'string' ? header : null;
}

function attachPrivateAccess(req, res, next) {
  req.hasPrivateAccess = isValidToken(getTokenFromRequest(req));
  next();
}

module.exports = { createSession, isValidToken, getTokenFromRequest, attachPrivateAccess };
