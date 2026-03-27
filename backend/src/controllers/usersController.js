const pool   = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getAll = async (req, res) => {
  try {
    const { role, status, search, page=1, limit=25 } = req.query;
    let where = ['1=1']; const params = []; let p = 1;
    if (role)   { where.push(`u.role=$${p++}`);   params.push(role); }
    if (status) { where.push(`u.status=$${p++}`); params.push(status); }
    if (search) { where.push(`(u.name ILIKE $${p} OR u.email ILIKE $${p})`); params.push(`%${search}%`); p++; }
    const offset = (page-1)*limit;
    const { rows } = await pool.query(`
      SELECT u.*, c.name as camp_name FROM users u
      LEFT JOIN camps c ON u.camp_id=c.id
      WHERE ${where.join(' AND ')}
      ORDER BY u.created_at DESC LIMIT $${p} OFFSET $${p+1}
    `, [...params, limit, offset]);
    const total = await pool.query(`SELECT COUNT(*) FROM users u WHERE ${where.join(' AND ')}`, params);
    const stats = await pool.query(`
      SELECT role, status, COUNT(*) as count FROM users GROUP BY role, status
    `);
    res.json({ data: rows, total: parseInt(total.rows[0].count), stats: stats.rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.*, c.name as camp_name FROM users u
      LEFT JOIN camps c ON u.camp_id=c.id WHERE u.id=$1
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ data: rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, email, password, role, camp_id, phone, country, bio } = req.body;
    if (!name||!email||!password) return res.status(400).json({ error: 'Nom, email et mot de passe requis' });
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(`
      INSERT INTO users (name,email,password_hash,role,camp_id,phone,country,bio,is_active,email_verified,status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,true,'approved') RETURNING *
    `, [name,email,hash,role||'volunteer',camp_id||null,phone||null,country||null,bio||null]);
    res.status(201).json({ data: rows[0] });
  } catch(e) {
    if (e.code==='23505') return res.status(400).json({ error: 'Email déjà utilisé' });
    res.status(500).json({ error: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, email, role, camp_id, phone, country, bio, is_active, status, avatar_url } = req.body;
    const { rows } = await pool.query(`
      UPDATE users SET name=$1,email=$2,role=$3,camp_id=$4,phone=$5,country=$6,bio=$7,is_active=$8,status=$9,avatar_url=$10,updated_at=NOW()
      WHERE id=$11 RETURNING *
    `, [name,email,role,camp_id||null,phone||null,country||null,bio||null,is_active,status,avatar_url||null,req.params.id]);
    res.json({ data: rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.approve = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      UPDATE users SET status='approved', is_active=true, updated_at=NOW()
      WHERE id=$1 RETURNING *
    `, [req.params.id]);

    // Send approval email
    try {
      const sendEmail = require('../controllers/authController').sendEmail;
      if (sendEmail) await sendEmail({
        to: rows[0].email,
        subject: 'IRAGI — Votre compte a été approuvé !',
        html: `<div style="font-family:Arial;padding:32px;background:#F5EFE6;border-radius:16px"><h2 style="color:#4A3728">Félicitations, ${rows[0].name} !</h2><p style="color:#8B6F55">Votre compte IRAGI a été approuvé. Vous pouvez maintenant vous connecter.</p><a href="${process.env.FRONTEND_URL}/login" style="background:#C9A84C;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Se connecter →</a></div>`
      });
    } catch(e) {}

    res.json({ data: rows[0], message: 'Utilisateur approuvé' });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.reject = async (req, res) => {
  try {
    const { reason } = req.body;
    const { rows } = await pool.query(`
      UPDATE users SET status='rejected', is_active=false, updated_at=NOW() WHERE id=$1 RETURNING *
    `, [req.params.id]);
    res.json({ data: rows[0], message: 'Utilisateur rejeté' });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.suspend = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      UPDATE users SET status='suspended', is_active=false WHERE id=$1 RETURNING *
    `, [req.params.id]);
    res.json({ data: rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.params.id]);
    res.json({ message: 'Mot de passe réinitialisé' });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.delete = async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.getPendingRegistrations = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM public_registrations WHERE status='pending' ORDER BY created_at DESC
    `);
    res.json({ data: rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
};
