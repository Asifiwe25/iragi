const jwt  = require('jsonwebtoken');
const pool = require('../config/db');

exports.auth = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token manquant' });
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query('SELECT * FROM users WHERE id=$1 AND is_active=true', [id]);
    if (!rows.length) return res.status(401).json({ error: 'Utilisateur non trouvé ou inactif' });
    req.user = rows[0];
    next();
  } catch (err) { res.status(401).json({ error: 'Token invalide' }); }
};

exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Non authentifié' });
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: `Accès refusé. Rôle requis: ${roles.join(' ou ')}` });
  next();
};
