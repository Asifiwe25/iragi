const pool = require('../config/db');

exports.getContent = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM homepage_content ORDER BY section, key');
    const content = {};
    rows.forEach(r => {
      if (!content[r.section]) content[r.section] = {};
      content[r.section][r.key] = { fr: r.value_fr, en: r.value_en, sw: r.value_sw };
    });
    res.json({ data: content });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.updateContent = async (req, res) => {
  try {
    const { section, key, value_fr, value_en, value_sw } = req.body;
    const { rows } = await pool.query(`
      INSERT INTO homepage_content (section, key, value_fr, value_en, value_sw, updated_by, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,NOW())
      ON CONFLICT (section,key) DO UPDATE SET value_fr=$3,value_en=$4,value_sw=$5,updated_by=$6,updated_at=NOW()
      RETURNING *
    `, [section, key, value_fr, value_en, value_sw, req.user?.id]);
    res.json({ data: rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.getAllContent = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM homepage_content ORDER BY section, key');
    res.json({ data: rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
};
