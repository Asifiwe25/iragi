// backend/src/middleware/audit.js
const pool = require('../config/db');

const audit = (action, entity) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = async (data) => {
    if (res.statusCode < 400 && req.user) {
      try {
        await pool.query(
          `INSERT INTO audit_logs (user_id, action, target_entity, target_id, details, ip_address)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [req.user.id, action, entity,
           data?.data?.id || req.params?.id || null,
           JSON.stringify({ body: req.body }),
           req.ip]
        );
      } catch (e) { /* silent */ }
    }
    return originalJson(data);
  };
  next();
};

module.exports = audit;
