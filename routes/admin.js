const router = require('express').Router();
const {
  authenticateAdmin,
  requireAdmin,
  revokeAdminToken
} = require('../services/adminAuth');

router.post('/login', (req, res) => {
  const { login, password } = req.body || {};
  const session = authenticateAdmin(login, password);

  if (!session) {
    return res.status(401).json({ error: 'Неверный логин или пароль' });
  }

  res.json({
    login: session.login,
    token: session.token
  });
});

router.get('/me', requireAdmin, (req, res) => {
  res.json({
    login: req.admin.login
  });
});

router.post('/logout', requireAdmin, (req, res) => {
  revokeAdminToken(req.admin.token);
  res.json({ message: 'Выход выполнен' });
});

module.exports = router;
