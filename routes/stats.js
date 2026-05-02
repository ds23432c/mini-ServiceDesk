const router = require('express').Router();
const db = require('../db');

router.get('/', async (req, res) => {
  const [[totals]] = await db.query(`
    SELECT
      COUNT(*) AS total,
      COALESCE(SUM(status='new'), 0) AS new_count,
      COALESCE(SUM(status='in_progress'), 0) AS in_progress_count,
      COALESCE(SUM(status='waiting'), 0) AS waiting_count,
      COALESCE(SUM(status IN ('resolved','closed')), 0) AS done_count,
      COALESCE(SUM(status NOT IN ('resolved','closed')), 0) AS open_count,
      COALESCE(SUM(priority='critical' AND status NOT IN ('resolved','closed')), 0) AS critical_open,
      ROUND(AVG(CASE WHEN resolved_at IS NOT NULL
                     THEN TIMESTAMPDIFF(HOUR, created_at, resolved_at) END),1) AS avg_resolution_h,
      ROUND(AVG(CASE WHEN status NOT IN ('resolved','closed')
                     THEN TIMESTAMPDIFF(HOUR, created_at, NOW()) END),1) AS avg_open_age_h
    FROM tickets`);

  const [[activity]] = await db.query(`
    SELECT
      COALESCE(SUM(created_at >= NOW() - INTERVAL 7 DAY), 0) AS tickets_7d,
      COALESCE(SUM(created_at >= NOW() - INTERVAL 1 DAY), 0) AS tickets_24h
    FROM tickets`);

  const [[commentActivity]] = await db.query(`
    SELECT
      COALESCE(COUNT(*), 0) AS comments_total,
      COALESCE(SUM(created_at >= NOW() - INTERVAL 7 DAY), 0) AS comments_7d,
      COALESCE(SUM(is_internal = 1), 0) AS internal_comments,
      COALESCE(SUM(is_internal = 0), 0) AS public_comments
    FROM comments`);

  const [[agentActivity]] = await db.query(`
    SELECT COALESCE(COUNT(DISTINCT assigned_to), 0) AS active_agents
    FROM tickets
    WHERE assigned_to IS NOT NULL AND status NOT IN ('resolved','closed')`);

  const [byStatus] = await db.query(`
    SELECT status AS label, COUNT(*) AS value
    FROM tickets
    GROUP BY status
    ORDER BY value DESC`);

  const [byPriority] = await db.query(`
    SELECT priority AS label, COUNT(*) AS value
    FROM tickets
    GROUP BY priority
    ORDER BY FIELD(priority, 'critical', 'high', 'medium', 'low')`);

  const [byClient] = await db.query(`
    SELECT c.name AS label, COUNT(t.id) AS value
    FROM clients c
    LEFT JOIN tickets t ON t.client_id = c.id
    GROUP BY c.id
    ORDER BY value DESC, c.name ASC
    LIMIT 5`);

  const [byDay] = await db.query(`
    SELECT DATE(created_at) AS label, COUNT(*) AS value
    FROM tickets
    WHERE created_at >= NOW() - INTERVAL 14 DAY
    GROUP BY DATE(created_at)
    ORDER BY label`);

  const [byAgent] = await db.query(`
    SELECT COALESCE(u.name, 'Не назначен') AS label, COUNT(t.id) AS value
    FROM users u
    LEFT JOIN tickets t
      ON t.assigned_to = u.id
     AND t.status NOT IN ('resolved','closed')
    GROUP BY u.id
    ORDER BY value DESC, u.name ASC
    LIMIT 8`);

  const [byCategory] = await db.query(`
    SELECT COALESCE(category, 'Без категории') AS label, COUNT(*) AS value
    FROM tickets
    GROUP BY category
    ORDER BY value DESC, label ASC
    LIMIT 8`);

  const [overdueByClient] = await db.query(`
    SELECT c.name AS label, COUNT(*) AS value
    FROM tickets t
    JOIN clients c ON t.client_id = c.id
    WHERE t.status NOT IN ('resolved','closed')
      AND TIMESTAMPDIFF(HOUR, t.created_at, NOW()) > c.sla_hours
    GROUP BY c.id
    ORDER BY value DESC, c.name ASC
    LIMIT 5`);

  const [slaBreached] = await db.query(`
    SELECT COUNT(*) AS count
    FROM tickets t
    JOIN clients c ON t.client_id = c.id
    WHERE t.status NOT IN ('resolved','closed')
      AND TIMESTAMPDIFF(HOUR, t.created_at, NOW()) > c.sla_hours`);

  res.json({
    totals: {
      ...totals,
      slaBreached: Number(slaBreached[0].count || 0)
    },
    activity,
    commentActivity,
    agentActivity,
    byStatus,
    byPriority,
    byClient,
    byDay,
    byAgent,
    byCategory,
    overdueByClient,
    slaBreached: Number(slaBreached[0].count || 0)
  });
});

module.exports = router;
