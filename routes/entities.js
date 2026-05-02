const router = require('express').Router();
const db = require('../db');
const { requireAdmin } = require('../services/adminAuth');

// Клиенты
router.get('/clients', async (req, res) => {
  const [rows] = await db.query(`
    SELECT c.*, COUNT(t.id) AS ticket_count
    FROM clients c
    LEFT JOIN tickets t ON t.client_id = c.id
    GROUP BY c.id ORDER BY c.name`);
  res.json(rows);
});

router.post('/clients', requireAdmin, async (req, res) => {
  const { name, email, phone, company_type, sla_hours } = req.body;
  const [r] = await db.query(
    'INSERT INTO clients (name,email,phone,company_type,sla_hours) VALUES (?,?,?,?,?)',
    [name, email || '', phone || '', company_type || 'smb', sla_hours || 24]);
  res.json({ id: r.insertId });
});

router.delete('/clients/:id', requireAdmin, async (req, res) => {
  await db.query('DELETE FROM clients WHERE id = ?', [req.params.id]);
  res.json({ message: 'Удалено' });
});

// Агенты
router.get('/users', async (req, res) => {
  const [rows] = await db.query(`
    SELECT u.*, COUNT(t.id) AS active_tickets
    FROM users u
    LEFT JOIN tickets t ON t.assigned_to = u.id AND t.status NOT IN ('resolved','closed')
    GROUP BY u.id ORDER BY u.name`);
  res.json(rows);
});

router.post('/users', requireAdmin, async (req, res) => {
  const { name, email, role } = req.body;
  const [r] = await db.query(
    'INSERT INTO users (name,email,role) VALUES (?,?,?)',
    [name, email, role || 'agent']);
  res.json({ id: r.insertId });
});

module.exports = router;
