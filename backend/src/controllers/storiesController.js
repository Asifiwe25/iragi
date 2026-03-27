const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const { published, category, language, page=1, limit=20 } = req.query;
    let where = ['1=1']; const params = []; let p = 1;
    if (published !== undefined) { where.push(`is_published=$${p++}`); params.push(published==='true'); }
    if (category) { where.push(`category=$${p++}`); params.push(category); }
    if (language) { where.push(`language=$${p++}`); params.push(language); }
    const offset = (page-1)*limit;
    const { rows } = await pool.query(`
      SELECT s.*, u.name as approved_by_name FROM stories s
      LEFT JOIN users u ON s.approved_by=u.id
      WHERE ${where.join(' AND ')}
      ORDER BY s.created_at DESC LIMIT $${p} OFFSET $${p+1}
    `, [...params, limit, offset]);
    const total = await pool.query(`SELECT COUNT(*) FROM stories WHERE ${where.join(' AND ')}`, params);
    res.json({ data: rows, total: parseInt(total.rows[0].count) });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { title,content,author_name,author_age,origin,category,media_url,media_type,is_anonymous,language } = req.body;
    if (!content) return res.status(400).json({ error: 'Contenu requis' });
    const { rows } = await pool.query(`
      INSERT INTO stories (title,content,author_name,author_age,origin,category,media_url,media_type,is_anonymous,language)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [title||null,content,author_name||null,author_age||null,origin||null,category||'other',media_url||null,media_type||'none',is_anonymous||false,language||'fr']);
    res.status(201).json({ data: rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const { title,content,author_name,author_age,origin,category,media_url,media_type,is_anonymous,language,is_published } = req.body;
    const approved_by = is_published ? req.user?.id : null;
    const approved_at = is_published ? new Date() : null;
    const { rows } = await pool.query(`
      UPDATE stories SET title=$1,content=$2,author_name=$3,author_age=$4,origin=$5,category=$6,media_url=$7,media_type=$8,is_anonymous=$9,language=$10,is_published=$11,approved_by=$12,approved_at=$13,updated_at=NOW()
      WHERE id=$14 RETURNING *
    `, [title,content,author_name,author_age,origin,category,media_url,media_type,is_anonymous,language,is_published,approved_by,approved_at,req.params.id]);
    res.json({ data: rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.publish = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      UPDATE stories SET is_published=true, approved_by=$1, approved_at=NOW(), updated_at=NOW()
      WHERE id=$2 RETURNING *
    `, [req.user?.id, req.params.id]);
    res.json({ data: rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.delete = async (req, res) => {
  try {
    await pool.query('DELETE FROM stories WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
};
