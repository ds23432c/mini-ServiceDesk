const crypto = require('crypto');

const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SESSION_TTL_MS = Number(process.env.ADMIN_SESSION_TTL_MS || 1000 * 60 * 60 * 8);

const sessions = new Map();

function cleanupSessions() {
  const now = Date.now();

  for (const [token, session] of sessions.entries()) {
    if (session.expiresAt <= now) {
      sessions.delete(token);
    }
  }
}

function issueAdminToken(login) {
  cleanupSessions();

  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, {
    login,
    expiresAt: Date.now() + SESSION_TTL_MS
  });

  return token;
}

function revokeAdminToken(token) {
  sessions.delete(token);
}

function authenticateAdmin(login, password) {
  if (login !== ADMIN_LOGIN || password !== ADMIN_PASSWORD) {
    return null;
  }

  return {
    login: ADMIN_LOGIN,
    token: issueAdminToken(ADMIN_LOGIN)
  };
}

function readToken(req) {
  return req.get('x-admin-token') || req.get('authorization')?.replace(/^Bearer\s+/i, '');
}

function requireAdmin(req, res, next) {
  cleanupSessions();

  const token = readToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Требуется вход в администрирование' });
  }

  const session = sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Сессия администратора истекла' });
  }

  req.admin = {
    login: session.login,
    token
  };

  next();
}

module.exports = {
  authenticateAdmin,
  requireAdmin,
  revokeAdminToken
};
