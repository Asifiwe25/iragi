// backend/src/controllers/campsController.js
const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*, u.name as admin_name,
             ROUND((c.current_occupancy::decimal / NULLIF(c.capacity,0)) * 100, 1) as occupancy_pct
      FROM camps c LEFT JOIN users u ON c.admin_id=u.id
      WHERE c.is_active=true ORDER BY c.name
    `);
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM camps WHERE id=$1', [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Camp not found' });
    res.json({ data: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, region, country, latitude, longitude, capacity } = req.body;
    const { rows } = await pool.query(`
      INSERT INTO camps (name,region,country,latitude,longitude,capacity)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [name, region, country||'Rwanda', latitude, longitude, capacity||0]);
    res.status(201).json({ data: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const { name, region, country, latitude, longitude, capacity, current_occupancy, admin_id } = req.body;
    const { rows } = await pool.query(`
      UPDATE camps SET name=$1,region=$2,country=$3,latitude=$4,longitude=$5,
        capacity=$6,current_occupancy=$7,admin_id=$8,updated_at=NOW()
      WHERE id=$9 RETURNING *
    `, [name, region, country, latitude, longitude, capacity, current_occupancy, admin_id, req.params.id]);
    res.json({ data: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getInventory = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM inventory WHERE camp_id=$1 ORDER BY item_type, item_name',
      [req.params.id]
    );
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
