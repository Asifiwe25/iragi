const pool = require('../config/db');

exports.getStats = async (req, res) => {
  try {
    const [refugees, cases, camps, dists, users, financings, courses, stories, messages, campOcc, recent, critical, recentFin, finByProg] = await Promise.all([
      pool.query(`SELECT COUNT(*) as total, COUNT(*) FILTER(WHERE status='verified') as verified, COUNT(*) FILTER(WHERE status='registered') as registered, COUNT(*) FILTER(WHERE flags && ARRAY['medical_need','unaccompanied_minor']) as flagged FROM refugees`),
      pool.query(`SELECT COUNT(*) FILTER(WHERE status='open') as open, COUNT(*) FILTER(WHERE status='in_progress') as in_progress, COUNT(*) FILTER(WHERE priority='critical' AND status!='closed') as critical FROM cases`),
      pool.query(`SELECT COUNT(*) as total, COALESCE(SUM(capacity),0) as total_capacity, COALESCE(SUM(current_occupancy),0) as total_occupancy FROM camps WHERE is_active=true`),
      pool.query(`SELECT COUNT(*) FILTER(WHERE distribution_date=CURRENT_DATE) as today, COUNT(*) as total FROM distributions`),
      pool.query(`SELECT COUNT(*) FILTER(WHERE role='volunteer') as volunteers, COUNT(*) FILTER(WHERE role='donor') as donors, COUNT(*) FILTER(WHERE role='partner') as partners, COUNT(*) FILTER(WHERE role='refugee') as refugees_users, COUNT(*) FILTER(WHERE status='pending') as pending FROM users WHERE role!='admin'`),
      pool.query(`SELECT COALESCE(SUM(amount),0) as total, COUNT(*) as count FROM financings WHERE status!='cancelled'`),
      pool.query(`SELECT COUNT(*) as total, COUNT(*) FILTER(WHERE is_published=true) as published FROM courses`),
      pool.query(`SELECT COUNT(*) as total, COUNT(*) FILTER(WHERE is_published=true) as published FROM stories`),
      pool.query(`SELECT COUNT(*) FILTER(WHERE read_at IS NULL AND deleted_at IS NULL AND to_user_id=$1) as unread FROM messages`, [req.user.id]),
      pool.query(`SELECT name, current_occupancy, capacity, ROUND(current_occupancy::numeric/NULLIF(capacity,0)*100,1) as pct FROM camps WHERE is_active=true ORDER BY current_occupancy DESC`),
      pool.query(`SELECT r.*, c.name as camp_name FROM refugees r LEFT JOIN camps c ON r.current_camp_id=c.id ORDER BY r.created_at DESC LIMIT 6`),
      pool.query(`SELECT cs.*, r.first_name||' '||r.last_name as refugee_name, r.rid FROM cases cs JOIN refugees r ON cs.refugee_id=r.id WHERE cs.priority='critical' AND cs.status!='closed' ORDER BY cs.created_at DESC LIMIT 5`),
      pool.query(`SELECT * FROM financings ORDER BY created_at DESC LIMIT 4`),
      pool.query(`SELECT program, SUM(amount) as total, COUNT(*) as count FROM financings WHERE status!='cancelled' AND program IS NOT NULL GROUP BY program`),
    ]);

    res.json({
      refugees: refugees.rows[0],
      cases: cases.rows[0],
      camps: camps.rows[0],
      distributions: dists.rows[0],
      users: users.rows[0],
      financings: financings.rows[0],
      courses: courses.rows[0],
      stories: stories.rows[0],
      messages: messages.rows[0],
      campOccupancy: campOcc.rows,
      recentRegistrations: recent.rows,
      criticalCases: critical.rows,
      recentFinancings: recentFin.rows,
      financingByProgram: finByProg.rows,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
