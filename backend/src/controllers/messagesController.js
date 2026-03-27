const pool = require('../config/db');

async function sendEmail({ to, subject, html }) {
  if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your_sendgrid_key') {
    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      await sgMail.send({ to, from: process.env.FROM_EMAIL || 'noreply@iragi.org', subject, html });
    } catch(e) { console.error('Email error:', e.message); }
  } else {
    console.log(`\n📧 EMAIL TO: ${to}\n   SUBJECT: ${subject}\n`);
  }
}

exports.inbox = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT m.*, u.name as from_user_name FROM messages m
      LEFT JOIN users u ON m.from_user_id=u.id
      WHERE m.to_user_id=$1 AND m.deleted_at IS NULL
      ORDER BY m.created_at DESC LIMIT 50
    `, [req.user.id]);
    res.json({ data: rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.sent = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT m.*, u.name as to_user_name FROM messages m
      LEFT JOIN users u ON m.to_user_id=u.id
      WHERE m.from_user_id=$1 AND m.deleted_at IS NULL
      ORDER BY m.created_at DESC LIMIT 50
    `, [req.user.id]);
    res.json({ data: rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.getPublic = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM messages WHERE is_public=true AND deleted_at IS NULL
      ORDER BY created_at DESC LIMIT 100
    `);
    res.json({ data: rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.unreadCount = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE to_user_id=$1 AND read_at IS NULL AND deleted_at IS NULL',
      [req.user.id]
    );
    res.json({ count: parseInt(rows[0].count) });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.send = async (req, res) => {
  try {
    const { to_user_id, subject, body } = req.body;
    if (!subject||!body) return res.status(400).json({ error: 'Sujet et message requis' });
    const { rows } = await pool.query(`
      INSERT INTO messages (from_user_id, to_user_id, subject, body)
      VALUES ($1,$2,$3,$4) RETURNING *
    `, [req.user.id, to_user_id||null, subject, body]);
    res.status(201).json({ data: rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

// Message from homepage (public, no auth)
exports.sendPublic = async (req, res) => {
  try {
    const { from_name, from_email, subject, body } = req.body;
    if (!from_email||!subject||!body) return res.status(400).json({ error: 'Email, sujet et message requis' });

    // Find admins to send to
    const admins = await pool.query("SELECT id FROM users WHERE role='admin' AND is_active=true LIMIT 1");
    const adminId = admins.rows[0]?.id || null;

    const { rows } = await pool.query(`
      INSERT INTO messages (from_name, from_email, to_user_id, subject, body, is_public)
      VALUES ($1,$2,$3,$4,$5,true) RETURNING *
    `, [from_name, from_email, adminId, subject, body]);

    // Notify admins by email
    const allAdmins = await pool.query("SELECT email FROM users WHERE role='admin' AND is_active=true");
    for (const admin of allAdmins.rows) {
      await sendEmail({
        to: admin.email,
        subject: `IRAGI — Nouveau message de ${from_name}: ${subject}`,
        html: `
          <div style="font-family:Arial;padding:32px;background:#F5EFE6;border-radius:16px">
            <h2 style="color:#4A3728">Nouveau message du site IRAGI</h2>
            <p><strong>De:</strong> ${from_name} (${from_email})</p>
            <p><strong>Sujet:</strong> ${subject}</p>
            <div style="background:white;padding:20px;border-radius:12px;border:1px solid #EDE0CC;margin:16px 0">
              <p style="color:#4A3728;white-space:pre-wrap">${body}</p>
            </div>
            <p style="color:#8B6F55;font-size:13px">Connectez-vous au dashboard pour répondre.</p>
          </div>
        `
      });
    }

    res.status(201).json({ data: rows[0], message: 'Message envoyé avec succès !' });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.reply = async (req, res) => {
  try {
    const { reply_body } = req.body;
    const { rows } = await pool.query(`
      SELECT * FROM messages WHERE id=$1
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Message non trouvé' });
    const msg = rows[0];

    await pool.query(`
      UPDATE messages SET reply_body=$1, replied_at=NOW() WHERE id=$2
    `, [reply_body, req.params.id]);

    // Send reply to original sender
    const replyTo = msg.from_email;
    if (replyTo) {
      await sendEmail({
        to: replyTo,
        subject: `IRAGI — Réponse: ${msg.subject}`,
        html: `
          <div style="font-family:Arial;padding:32px;background:#F5EFE6;border-radius:16px">
            <div style="background:linear-gradient(135deg,#C9A84C,#A8892A);padding:20px;border-radius:12px;margin-bottom:24px;text-align:center">
              <h1 style="color:white;margin:0;font-size:24px">IRAGI</h1>
            </div>
            <h2 style="color:#4A3728">Réponse à votre message</h2>
            <p style="color:#8B6F55">Bonjour ${msg.from_name||''},</p>
            <p style="color:#8B6F55">L'équipe IRAGI a répondu à votre message concernant: <strong>${msg.subject}</strong></p>
            <div style="background:white;padding:20px;border-radius:12px;border:1px solid #EDE0CC;margin:16px 0">
              <p style="color:#4A3728;white-space:pre-wrap">${reply_body}</p>
            </div>
            <hr style="border-color:#EDE0CC">
            <p style="color:#C8A882;font-size:12px">IRAGI · République Démocratique du Congo · ${process.env.FRONTEND_URL||''}</p>
          </div>
        `
      });
    }

    res.json({ success: true, message: 'Réponse envoyée' });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.markRead = async (req, res) => {
  try {
    await pool.query('UPDATE messages SET read_at=NOW() WHERE id=$1 AND to_user_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.delete = async (req, res) => {
  try {
    await pool.query('UPDATE messages SET deleted_at=NOW() WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
};
