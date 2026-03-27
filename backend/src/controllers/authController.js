require('dotenv').config();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../config/db');
const crypto  = require('crypto');

// Send email helper (uses SendGrid or logs to console)
async function sendEmail({ to, subject, html }) {
  if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your_sendgrid_key') {
    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      await sgMail.send({ to, from: process.env.FROM_EMAIL || 'noreply@iragi.org', subject, html });
    } catch(e) { console.error('Email error:', e.message); }
  } else {
    console.log(`\n📧 EMAIL TO: ${to}\n   SUBJECT: ${subject}\n   (Configure SENDGRID_API_KEY to send real emails)\n`);
  }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query(
      `SELECT u.*, c.name as camp_name FROM users u
       LEFT JOIN camps c ON u.camp_id = c.id
       WHERE u.email=$1`, [email]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    if (!user.password_hash) return res.status(401).json({ error: 'Compte non configuré' });
    if (!(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    if (user.status === 'pending') return res.status(403).json({ error: 'Compte en attente d\'approbation par l\'admin' });
    if (user.status === 'rejected') return res.status(403).json({ error: 'Compte refusé' });
    if (user.status === 'suspended') return res.status(403).json({ error: 'Compte suspendu' });
    if (!user.is_active) return res.status(403).json({ error: 'Compte désactivé' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    await pool.query('UPDATE users SET last_login=NOW() WHERE id=$1', [user.id]);

    res.json({
      token,
      user: {
        id: user.id, name: user.name, email: user.email,
        role: user.role, camp_id: user.camp_id, camp_name: user.camp_name,
        avatar_url: user.avatar_url, phone: user.phone, country: user.country
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.me = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.*, c.name as camp_name FROM users u
       LEFT JOIN camps c ON u.camp_id=c.id WHERE u.id=$1`, [req.user.id]
    );
    res.json({ user: rows[0] });
  } catch(err) { res.status(500).json({ error: err.message }); }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role, country, message } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Nom, email et mot de passe requis' });

    const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Email déjà utilisé' });

    const validRoles = ['refugee','donor','volunteer','partner'];
    const userRole = validRoles.includes(role) ? role : 'volunteer';
    const hash = await bcrypt.hash(password, 10);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const { rows } = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, phone, country, is_active, status, email_verified, verification_code, verification_expires)
      VALUES ($1,$2,$3,$4,$5,$6, false, 'pending', false, $7, $8) RETURNING id, name, email, role
    `, [name, email, hash, userRole, phone||null, country||null, code, expires]);

    // Save registration request
    await pool.query(`
      INSERT INTO public_registrations (name, email, phone, role, country, message)
      VALUES ($1,$2,$3,$4,$5,$6)
    `, [name, email, phone||null, userRole, country||null, message||null]);

    // Send verification email
    await sendEmail({
      to: email,
      subject: 'IRAGI — Vérification de votre email',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#F5EFE6;border-radius:16px">
          <div style="background:linear-gradient(135deg,#C9A84C,#A8892A);padding:20px;border-radius:12px;margin-bottom:24px;text-align:center">
            <h1 style="color:white;margin:0;font-size:28px">IRAGI</h1>
          </div>
          <h2 style="color:#4A3728">Bienvenue, ${name} !</h2>
          <p style="color:#8B6F55">Votre code de vérification est :</p>
          <div style="background:white;border:2px solid #C9A84C;border-radius:12px;padding:24px;text-align:center;margin:20px 0">
            <span style="font-size:36px;font-weight:bold;color:#C9A84C;letter-spacing:8px">${code}</span>
          </div>
          <p style="color:#8B6F55;font-size:14px">Ce code expire dans 24 heures.</p>
          <p style="color:#8B6F55;font-size:13px">Votre compte sera activé après validation par l'équipe IRAGI.</p>
          <hr style="border-color:#EDE0CC;margin:20px 0">
          <p style="color:#C8A882;font-size:12px">IRAGI · République Démocratique du Congo · alicebunani5@gmail.com</p>
        </div>
      `
    });

    // Notify admin
    const adminRows = await pool.query("SELECT email FROM users WHERE role='admin' LIMIT 3");
    for (const admin of adminRows.rows) {
      await sendEmail({
        to: admin.email,
        subject: `IRAGI — Nouvelle inscription: ${name} (${userRole})`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#F5EFE6;border-radius:16px">
            <h2 style="color:#4A3728">Nouvelle demande d'inscription</h2>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px;color:#8B6F55;font-weight:bold">Nom:</td><td style="padding:8px;color:#4A3728">${name}</td></tr>
              <tr><td style="padding:8px;color:#8B6F55;font-weight:bold">Email:</td><td style="padding:8px;color:#4A3728">${email}</td></tr>
              <tr><td style="padding:8px;color:#8B6F55;font-weight:bold">Rôle:</td><td style="padding:8px;color:#4A3728">${userRole}</td></tr>
              <tr><td style="padding:8px;color:#8B6F55;font-weight:bold">Pays:</td><td style="padding:8px;color:#4A3728">${country||'Non spécifié'}</td></tr>
              <tr><td style="padding:8px;color:#8B6F55;font-weight:bold">Message:</td><td style="padding:8px;color:#4A3728">${message||'—'}</td></tr>
            </table>
            <p style="color:#8B6F55">Connectez-vous au dashboard pour approuver ou rejeter cette demande.</p>
          </div>
        `
      });
    }

    res.status(201).json({
      message: 'Inscription réussie! Vérifiez votre email pour le code de confirmation.',
      user: rows[0]
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email=$1 AND verification_code=$2', [email, code]
    );
    if (!rows.length) return res.status(400).json({ error: 'Code invalide' });
    if (new Date() > new Date(rows[0].verification_expires))
      return res.status(400).json({ error: 'Code expiré' });
    await pool.query(
      'UPDATE users SET email_verified=true, verification_code=NULL WHERE id=$1', [rows[0].id]
    );
    res.json({ message: 'Email vérifié avec succès! En attente d\'approbation admin.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
    if (!(await bcrypt.compare(currentPassword, rows[0].password_hash)))
      return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id]);
    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, country, bio, avatar_url } = req.body;
    const { rows } = await pool.query(
      'UPDATE users SET name=$1,phone=$2,country=$3,bio=$4,avatar_url=$5,updated_at=NOW() WHERE id=$6 RETURNING *',
      [name, phone, country, bio, avatar_url, req.user.id]
    );
    res.json({ user: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
