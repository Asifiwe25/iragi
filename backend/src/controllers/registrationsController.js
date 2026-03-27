// controllers/registrationsController.js
const pool = require('../config/db');

exports.create = async (req, res) => {
  const { name, email, phone, role, country, message } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO public_registrations (name, email, phone, role, country, message) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, email, phone||null, role||'volunteer', country||null, message||null]
    );
    res.status(201).json({ data: rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.getAll = async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM public_registrations ORDER BY created_at DESC`);
    res.json({ data: rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
};
