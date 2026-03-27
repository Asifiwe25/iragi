// backend/src/controllers/casesController.js
const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const { refugee_id, status, priority, case_type, assigned_to, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = [], params = [], idx = 1;

    if (refugee_id) { where.push(`c.refugee_id=$${idx++}`); params.push(refugee_id); }
    if (status)     { where.push(`c.status=$${idx++}`);     params.push(status); }
    if (priority)   { where.push(`c.priority=$${idx++}`);   params.push(priority); }
    if (case_type)  { where.push(`c.case_type=$${idx++}`);  params.push(case_type); }
    if (assigned_to){ where.push(`c.assigned_to=$${idx++}`);params.push(assigned_to); }

    // Field workers only see their assigned cases
    if (req.user.role === 'field_worker') {
      where.push(`c.assigned_to=$${idx++}`);
      params.push(req.user.id);
    }

    const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const { rows } = await pool.query(`
      SELECT c.*,
             r.first_name || ' ' || r.last_name AS refugee_name, r.rid,
             u.name AS assigned_to_name
      FROM cases c
      LEFT JOIN refugees r ON c.refugee_id = r.id
      LEFT JOIN users u    ON c.assigned_to = u.id
      ${w}
      ORDER BY
        CASE c.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
        c.created_at DESC
      LIMIT $${idx} OFFSET $${idx+1}
    `, [...params, limit, offset]);

    const countRes = await pool.query(`SELECT COUNT(*) FROM cases c ${w}`, params);
    res.json({ data: rows, total: parseInt(countRes.rows[0].count) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*, r.first_name||' '||r.last_name AS refugee_name, r.rid,
             u.name AS assigned_to_name
      FROM cases c
      LEFT JOIN refugees r ON c.refugee_id=r.id
      LEFT JOIN users u    ON c.assigned_to=u.id
      WHERE c.id=$1
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Case not found' });

    const notes = await pool.query(
      `SELECT cn.*, u.name AS author_name FROM case_notes cn
       LEFT JOIN users u ON cn.author_id=u.id
       WHERE cn.case_id=$1 ORDER BY cn.created_at ASC`, [req.params.id]
    );
    res.json({ data: { ...rows[0], notes: notes.rows } });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { refugee_id, case_type, priority, title, description, assigned_to, due_date } = req.body;
    const { rows } = await pool.query(`
      INSERT INTO cases (refugee_id,case_type,priority,title,description,assigned_to,due_date,created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [refugee_id, case_type, priority||'medium', title, description, assigned_to, due_date, req.user.id]);
    res.status(201).json({ data: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const { status, priority, assigned_to, due_date, title, description } = req.body;
    const closedAt = status === 'closed' ? 'NOW()' : 'closed_at';
    const { rows } = await pool.query(`
      UPDATE cases SET
        status=$1, priority=$2, assigned_to=$3, due_date=$4, title=$5,
        description=$6, updated_at=NOW(),
        closed_at = CASE WHEN $1='closed' THEN NOW() ELSE closed_at END
      WHERE id=$7 RETURNING *
    `, [status, priority, assigned_to, due_date, title, description, req.params.id]);
    res.json({ data: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.addNote = async (req, res) => {
  try {
    const { content } = req.body;
    const { rows } = await pool.query(`
      INSERT INTO case_notes (case_id, author_id, content) VALUES ($1,$2,$3) RETURNING *
    `, [req.params.id, req.user.id, content]);
    await pool.query('UPDATE cases SET updated_at=NOW() WHERE id=$1', [req.params.id]);
    res.status(201).json({ data: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.delete = async (req, res) => {
  try {
    await pool.query('DELETE FROM cases WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
};
