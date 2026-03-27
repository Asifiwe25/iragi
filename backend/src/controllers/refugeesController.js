const pool = require('../config/db');

function genRID() {
  const year = new Date().getFullYear();
  const num  = Math.floor(10000 + Math.random() * 90000);
  return `IRAGI-${year}-${num}`;
}

exports.getAll = async (req, res) => {
  try {
    const { search, status, camp_id, gender, page=1, limit=25 } = req.query;
    let where = ['1=1']; const params = []; let p = 1;
    if (search)  { where.push(`(r.first_name ILIKE $${p} OR r.last_name ILIKE $${p} OR r.rid ILIKE $${p})`); params.push(`%${search}%`); p++; }
    if (status)  { where.push(`r.status=$${p++}`); params.push(status); }
    if (camp_id) { where.push(`r.current_camp_id=$${p++}`); params.push(camp_id); }
    if (gender)  { where.push(`r.gender=$${p++}`); params.push(gender); }
    const offset = (page-1)*limit;
    const { rows } = await pool.query(`
      SELECT r.*, c.name as camp_name FROM refugees r
      LEFT JOIN camps c ON r.current_camp_id=c.id
      WHERE ${where.join(' AND ')}
      ORDER BY r.created_at DESC LIMIT $${p} OFFSET $${p+1}
    `, [...params, limit, offset]);
    const total = await pool.query(`SELECT COUNT(*) FROM refugees r WHERE ${where.join(' AND ')}`, params);
    res.json({ data: rows, total: parseInt(total.rows[0].count) });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.*, c.name as camp_name FROM refugees r
      LEFT JOIN camps c ON r.current_camp_id=c.id WHERE r.id=$1
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Réfugié non trouvé' });
    res.json({ data: rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const [byNationality, byStatus, byGender, byOrigin] = await Promise.all([
      pool.query(`SELECT nationality, COUNT(*) as count FROM refugees GROUP BY nationality ORDER BY count DESC LIMIT 10`),
      pool.query(`SELECT status, COUNT(*) as count FROM refugees GROUP BY status`),
      pool.query(`SELECT gender, COUNT(*) as count FROM refugees GROUP BY gender`),
      pool.query(`SELECT origin_province, COUNT(*) as count FROM refugees WHERE origin_province IS NOT NULL GROUP BY origin_province ORDER BY count DESC LIMIT 10`),
    ]);
    res.json({ byNationality: byNationality.rows, byStatus: byStatus.rows, byGender: byGender.rows, byOrigin: byOrigin.rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { first_name, last_name, date_of_birth, gender, nationality, origin_province, origin_territory, origin_village, current_camp_id, arrival_date, status, flags, notes, education_level, health_notes } = req.body;
    if (!first_name||!last_name) return res.status(400).json({ error: 'Prénom et nom requis' });
    let rid = genRID();
    // ensure unique
    let exists = await pool.query('SELECT id FROM refugees WHERE rid=$1', [rid]);
    while (exists.rows.length) { rid = genRID(); exists = await pool.query('SELECT id FROM refugees WHERE rid=$1', [rid]); }
    const { rows } = await pool.query(`
      INSERT INTO refugees (rid,first_name,last_name,date_of_birth,gender,nationality,origin_province,origin_territory,origin_village,current_camp_id,arrival_date,status,flags,notes,education_level,health_notes,registered_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *
    `, [rid,first_name,last_name,date_of_birth||null,gender||'unknown',nationality||'Congolaise',origin_province||null,origin_territory||null,origin_village||null,current_camp_id||null,arrival_date||new Date(),status||'registered',flags||[],notes||null,education_level||null,health_notes||null,req.user?.id]);
    res.status(201).json({ data: rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const { first_name, last_name, date_of_birth, gender, nationality, origin_province, origin_territory, origin_village, current_camp_id, arrival_date, status, flags, notes, education_level, health_notes } = req.body;
    const { rows } = await pool.query(`
      UPDATE refugees SET first_name=$1,last_name=$2,date_of_birth=$3,gender=$4,nationality=$5,origin_province=$6,origin_territory=$7,origin_village=$8,current_camp_id=$9,arrival_date=$10,status=$11,flags=$12,notes=$13,education_level=$14,health_notes=$15,updated_at=NOW()
      WHERE id=$16 RETURNING *
    `, [first_name,last_name,date_of_birth,gender,nationality,origin_province,origin_territory,origin_village,current_camp_id||null,arrival_date,status,flags||[],notes,education_level,health_notes,req.params.id]);
    res.json({ data: rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.delete = async (req, res) => {
  try {
    await pool.query('DELETE FROM refugees WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
};
