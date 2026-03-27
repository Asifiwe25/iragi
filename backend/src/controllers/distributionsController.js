// backend/src/controllers/distributionsController.js
const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const { refugee_id, camp_id, date_from, date_to, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = [], params = [], idx = 1;

    if (refugee_id) { where.push(`d.refugee_id=$${idx++}`); params.push(refugee_id); }
    if (camp_id)    { where.push(`d.camp_id=$${idx++}`);    params.push(camp_id); }
    if (date_from)  { where.push(`d.distribution_date>=$${idx++}`); params.push(date_from); }
    if (date_to)    { where.push(`d.distribution_date<=$${idx++}`); params.push(date_to); }

    const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const { rows } = await pool.query(`
      SELECT d.*,
             r.first_name||' '||r.last_name AS refugee_name, r.rid,
             u.name AS distributed_by_name,
             c.name AS camp_name
      FROM distributions d
      LEFT JOIN refugees r ON d.refugee_id=r.id
      LEFT JOIN users u    ON d.distributed_by=u.id
      LEFT JOIN camps c    ON d.camp_id=c.id
      ${w}
      ORDER BY d.distribution_date DESC, d.created_at DESC
      LIMIT $${idx} OFFSET $${idx+1}
    `, [...params, limit, offset]);

    const countRes = await pool.query(`SELECT COUNT(*) FROM distributions d ${w}`, params);
    res.json({ data: rows, total: parseInt(countRes.rows[0].count) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { refugee_id, camp_id, item_type, item_name, quantity, unit, distribution_date, notes } = req.body;

    // Check for duplicate distribution today
    const dup = await pool.query(`
      SELECT id FROM distributions
      WHERE refugee_id=$1 AND item_type=$2 AND distribution_date=$3
    `, [refugee_id, item_type, distribution_date || new Date().toISOString().split('T')[0]]);

    if (dup.rows.length > 0) {
      return res.status(409).json({
        error: 'Duplicate distribution detected. This refugee already received this item today.',
        duplicate: true
      });
    }

    const { rows } = await pool.query(`
      INSERT INTO distributions
        (refugee_id, camp_id, item_type, item_name, quantity, unit, distributed_by, distribution_date, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [refugee_id, camp_id, item_type, item_name, quantity, unit,
        req.user.id, distribution_date || new Date().toISOString().split('T')[0], notes]);

    // Deduct from inventory
    await pool.query(`
      UPDATE inventory SET quantity = quantity - $1, updated_at=NOW()
      WHERE camp_id=$2 AND item_type=$3 AND quantity >= $1
    `, [quantity, camp_id, item_type]);

    res.status(201).json({ data: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getSummary = async (req, res) => {
  try {
    const { camp_id, date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    let where = [`d.distribution_date = $1`], params = [targetDate], idx = 2;
    if (camp_id) { where.push(`d.camp_id=$${idx++}`); params.push(camp_id); }

    const { rows } = await pool.query(`
      SELECT d.item_type, d.item_name, SUM(d.quantity) as total_qty, d.unit,
             COUNT(DISTINCT d.refugee_id) as recipients
      FROM distributions d
      WHERE ${where.join(' AND ')}
      GROUP BY d.item_type, d.item_name, d.unit
      ORDER BY d.item_type
    `, params);
    res.json({ data: rows, date: targetDate });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
