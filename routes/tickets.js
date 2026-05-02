const router = require('express').Router();
const db = require('../db');
const { requireAdmin } = require('../services/adminAuth');

// Список всех заявок
router.get('/', async (req, res) => {
  const { status, priority, client_id, category, sla, search } = req.query;
  let sql = `
    SELECT t.*, c.name AS client_name, u.name AS agent_name,
      TIMESTAMPDIFF(HOUR, t.created_at, NOW()) AS age_hours,
      cl.sla_hours,
      CASE WHEN TIMESTAMPDIFF(HOUR, t.created_at, NOW()) > cl.sla_hours
           THEN 1 ELSE 0 END AS sla_breached
    FROM tickets t
    LEFT JOIN clients c ON t.client_id = c.id
    LEFT JOIN users u   ON t.assigned_to = u.id
    LEFT JOIN clients cl ON t.client_id = cl.id
    WHERE 1=1
  `;
  const params = [];
  if (status)    { sql += ' AND t.status = ?';   params.push(status); }
  if (priority)  { sql += ' AND t.priority = ?'; params.push(priority); }
  if (client_id) { sql += ' AND t.client_id = ?';params.push(client_id); }
  if (category)  { sql += ' AND t.category = ?'; params.push(category); }
  if (sla === 'breached') {
    sql += ' AND TIMESTAMPDIFF(HOUR, t.created_at, NOW()) > COALESCE(cl.sla_hours, 24)';
  }
  if (sla === 'ok') {
    sql += ' AND TIMESTAMPDIFF(HOUR, t.created_at, NOW()) <= COALESCE(cl.sla_hours, 24)';
  }
  if (search)    { sql += ' AND (t.title LIKE ? OR t.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  sql += ' ORDER BY FIELD(t.priority,"critical","high","medium","low"), t.created_at DESC';
  const [rows] = await db.query(sql, params);
  res.json(rows);
});

// Метаданные для фильтров
router.get('/meta', async (req, res) => {
  const [categories] = await db.query(`
    SELECT DISTINCT category
    FROM tickets
    WHERE category IS NOT NULL AND category <> ''
    ORDER BY category ASC
  `);

  res.json({
    categories: categories.map(row => row.category)
  });
});

// Одна заявка + комментарии
router.get('/:id', async (req, res) => {
  const [[ticket]] = await db.query(`
    SELECT t.*, c.name AS client_name, c.email AS client_email,
           c.sla_hours, u.name AS agent_name
    FROM tickets t
    LEFT JOIN clients c ON t.client_id = c.id
    LEFT JOIN users u   ON t.assigned_to = u.id
    WHERE t.id = ?`, [req.params.id]);
  if (!ticket) return res.status(404).json({ error: 'Не найдено' });

  const [comments] = await db.query(
    'SELECT * FROM comments WHERE ticket_id = ? ORDER BY created_at ASC',
    [req.params.id]
  );
  res.json({ ...ticket, comments });
});

// Создать заявку
router.post('/', requireAdmin, async (req, res) => {
  const { title, description, priority, category, client_id, assigned_to } = req.body;
  const [result] = await db.query(
    'INSERT INTO tickets (title, description, priority, category, client_id, assigned_to) VALUES (?,?,?,?,?,?)',
    [title, description || '', priority || 'medium', category || '', client_id || null, assigned_to || null]
  );
  res.json({ id: result.insertId, message: 'Заявка создана' });
});

// Обновить заявку
router.put('/:id', async (req, res) => {
  const { title, description, status, priority, category, assigned_to } = req.body;
  const resolved_at = status === 'resolved' ? new Date() : null;
  await db.query(
    `UPDATE tickets SET title=?, description=?, status=?, priority=?,
     category=?, assigned_to=?, resolved_at=? WHERE id=?`,
    [title, description, status, priority, category, assigned_to || null, resolved_at, req.params.id]
  );
  res.json({ message: 'Обновлено' });
});

// Добавить комментарий
router.post('/:id/comments', async (req, res) => {
  const { author_name, body, is_internal } = req.body;
  await db.query(
    'INSERT INTO comments (ticket_id, author_name, body, is_internal) VALUES (?,?,?,?)',
    [req.params.id, author_name || 'Агент', body, is_internal ? 1 : 0]
  );
  res.json({ message: 'Комментарий добавлен' });
});

// Удалить заявку
router.delete('/:id', requireAdmin, async (req, res) => {
  await db.query('DELETE FROM tickets WHERE id = ?', [req.params.id]);
  res.json({ message: 'Удалено' });
});

module.exports = router;
