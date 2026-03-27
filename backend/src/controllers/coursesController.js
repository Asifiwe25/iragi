const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const { subject, level, published, page=1, limit=20 } = req.query;
    let where = ['1=1']; const params = []; let p = 1;
    if (subject)   { where.push(`subject=$${p++}`); params.push(subject); }
    if (level)     { where.push(`level=$${p++}`);   params.push(level); }
    if (published !== undefined) { where.push(`is_published=$${p++}`); params.push(published==='true'); }
    const offset = (page-1)*limit;
    const { rows } = await pool.query(`
      SELECT c.*, u.name as instructor_name,
        (SELECT COUNT(*) FROM course_lessons WHERE course_id=c.id) as lessons_count,
        (SELECT COUNT(*) FROM course_enrollments WHERE course_id=c.id) as enrollments_count
      FROM courses c LEFT JOIN users u ON c.instructor_id=u.id
      WHERE ${where.join(' AND ')}
      ORDER BY c.created_at DESC LIMIT $${p} OFFSET $${p+1}
    `, [...params, limit, offset]);
    const total = await pool.query(`SELECT COUNT(*) FROM courses WHERE ${where.join(' AND ')}`, params);
    res.json({ data: rows, total: parseInt(total.rows[0].count) });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*, u.name as instructor_name FROM courses c
      LEFT JOIN users u ON c.instructor_id=u.id WHERE c.id=$1
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const lessons = await pool.query('SELECT * FROM course_lessons WHERE course_id=$1 ORDER BY order_index', [req.params.id]);
    const enrollments = await pool.query(`
      SELECT ce.*, r.first_name, r.last_name, r.rid FROM course_enrollments ce
      JOIN refugees r ON ce.refugee_id=r.id WHERE ce.course_id=$1
    `, [req.params.id]);
    res.json({ data: { ...rows[0], lessons: lessons.rows, enrollments: enrollments.rows } });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { title,description,subject,level,target_age_min,target_age_max,language,duration_hours,cover_url } = req.body;
    if (!title) return res.status(400).json({ error: 'Titre requis' });
    const { rows } = await pool.query(`
      INSERT INTO courses (title,description,subject,level,target_age_min,target_age_max,language,duration_hours,cover_url,created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [title,description,subject||'other',level||'all',target_age_min||5,target_age_max||18,language||'fr',duration_hours||10,cover_url||null,req.user?.id]);
    res.status(201).json({ data: rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const { title,description,subject,level,target_age_min,target_age_max,language,duration_hours,cover_url,is_published,instructor_id } = req.body;
    const { rows } = await pool.query(`
      UPDATE courses SET title=$1,description=$2,subject=$3,level=$4,target_age_min=$5,target_age_max=$6,language=$7,duration_hours=$8,cover_url=$9,is_published=$10,instructor_id=$11,updated_at=NOW()
      WHERE id=$12 RETURNING *
    `, [title,description,subject,level,target_age_min,target_age_max,language,duration_hours,cover_url,is_published,instructor_id||null,req.params.id]);
    res.json({ data: rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.delete = async (req, res) => {
  try {
    await pool.query('DELETE FROM courses WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.addLesson = async (req, res) => {
  try {
    const { title,description,content_type,content_url,content_text,duration_min,is_free } = req.body;
    const order = await pool.query('SELECT COALESCE(MAX(order_index),0)+1 as next FROM course_lessons WHERE course_id=$1', [req.params.id]);
    const { rows } = await pool.query(`
      INSERT INTO course_lessons (course_id,title,description,content_type,content_url,content_text,order_index,duration_min,is_free)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [req.params.id,title,description,content_type||'text',content_url||null,content_text||null,order.rows[0].next,duration_min||30,is_free!==false]);
    res.status(201).json({ data: rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.updateLesson = async (req, res) => {
  try {
    const { title,description,content_type,content_url,content_text,duration_min,is_free,order_index } = req.body;
    const { rows } = await pool.query(`
      UPDATE course_lessons SET title=$1,description=$2,content_type=$3,content_url=$4,content_text=$5,duration_min=$6,is_free=$7,order_index=$8
      WHERE id=$9 AND course_id=$10 RETURNING *
    `, [title,description,content_type,content_url,content_text,duration_min,is_free,order_index,req.params.lessonId,req.params.id]);
    res.json({ data: rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.deleteLesson = async (req, res) => {
  try {
    await pool.query('DELETE FROM course_lessons WHERE id=$1 AND course_id=$2', [req.params.lessonId, req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.enroll = async (req, res) => {
  try {
    const { refugee_id } = req.body;
    const { rows } = await pool.query(`
      INSERT INTO course_enrollments (course_id,refugee_id,enrolled_by)
      VALUES ($1,$2,$3) ON CONFLICT (course_id,refugee_id) DO NOTHING RETURNING *
    `, [req.params.id, refugee_id, req.user?.id]);
    res.status(201).json({ data: rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.updateProgress = async (req, res) => {
  try {
    const { progress_pct } = req.body;
    const completed = progress_pct >= 100 ? new Date() : null;
    const { rows } = await pool.query(`
      UPDATE course_enrollments SET progress_pct=$1, completed_at=$2
      WHERE course_id=$3 AND refugee_id=$4 RETURNING *
    `, [progress_pct, completed, req.params.id, req.body.refugee_id]);
    res.json({ data: rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
};
