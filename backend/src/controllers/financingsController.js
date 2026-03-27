const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const { type, status, program, page=1, limit=20 } = req.query;
    let where = ['1=1'];
    const params = [];
    let p = 1;
    if (type)    { where.push(`f.type=$${p++}`);    params.push(type); }
    if (status)  { where.push(`f.status=$${p++}`);  params.push(status); }
    if (program) { where.push(`f.program=$${p++}`); params.push(program); }

    const offset = (page-1) * limit;
    const { rows } = await pool.query(`
      SELECT f.*, u.name as created_by_name, du.name as donor_user_name
      FROM financings f
      LEFT JOIN users u ON f.created_by=u.id
      LEFT JOIN users du ON f.donor_id=du.id
      WHERE ${where.join(' AND ')}
      ORDER BY f.receipt_date DESC, f.created_at DESC
      LIMIT $${p} OFFSET $${p+1}
    `, [...params, limit, offset]);

    const total = await pool.query(`SELECT COUNT(*) FROM financings f WHERE ${where.join(' AND ')}`, params);
    const stats = await pool.query(`
      SELECT
        COALESCE(SUM(amount) FILTER(WHERE status!='cancelled'),0) as total_received,
        COALESCE(SUM(amount) FILTER(WHERE status='allocated'),0) as total_allocated,
        COALESCE(SUM(amount) FILTER(WHERE status='spent'),0) as total_spent,
        COALESCE(SUM(amount) FILTER(WHERE status='pending'),0) as total_pending,
        COUNT(*) as total_count
      FROM financings WHERE status!='cancelled'
    `);

    res.json({ data: rows, total: parseInt(total.rows[0].count), stats: stats.rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT f.*, u.name as created_by_name
      FROM financings f LEFT JOIN users u ON f.created_by=u.id
      WHERE f.id=$1
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const allocs = await pool.query(`
      SELECT ba.*, u.name as allocated_by_name FROM budget_allocations ba
      LEFT JOIN users u ON ba.allocated_by=u.id
      WHERE ba.financing_id=$1
    `, [req.params.id]);
    res.json({ data: { ...rows[0], allocations: allocs.rows } });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { type,title,description,amount,currency,donor_name,donor_email,donor_id,donor_country,purpose,program,status,receipt_date,notes } = req.body;
    if (!title||!amount) return res.status(400).json({ error: 'Titre et montant requis' });
    const usd = currency==='EUR' ? amount*1.08 : currency==='USD' ? amount : amount;
    const { rows } = await pool.query(`
      INSERT INTO financings (type,title,description,amount,currency,amount_usd,donor_name,donor_email,donor_id,donor_country,purpose,program,status,receipt_date,notes,created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *
    `, [type||'donation',title,description||null,amount,currency||'EUR',usd,donor_name||null,donor_email||null,donor_id||null,donor_country||null,purpose||null,program||null,status||'received',receipt_date||new Date(),notes||null,req.user?.id||null]);
    res.status(201).json({ data: rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const { type,title,description,amount,currency,donor_name,donor_email,donor_country,purpose,program,status,receipt_date,allocated_date,notes } = req.body;
    const { rows } = await pool.query(`
      UPDATE financings SET type=$1,title=$2,description=$3,amount=$4,currency=$5,donor_name=$6,donor_email=$7,donor_country=$8,purpose=$9,program=$10,status=$11,receipt_date=$12,allocated_date=$13,notes=$14,updated_at=NOW()
      WHERE id=$15 RETURNING *
    `, [type,title,description,amount,currency,donor_name,donor_email,donor_country,purpose,program,status,receipt_date,allocated_date,notes,req.params.id]);
    res.json({ data: rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.delete = async (req, res) => {
  try {
    await pool.query('DELETE FROM financings WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.addAllocation = async (req, res) => {
  try {
    const { program, description, amount, currency } = req.body;
    const { rows } = await pool.query(`
      INSERT INTO budget_allocations (financing_id, program, description, amount, currency, allocated_by)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [req.params.id, program, description, amount, currency||'EUR', req.user?.id]);
    await pool.query(`UPDATE financings SET status='allocated',allocated_date=CURRENT_DATE WHERE id=$1`, [req.params.id]);
    res.status(201).json({ data: rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
};

exports.getSummary = async (req, res) => {
  try {
    const byType    = await pool.query(`SELECT type, SUM(amount) as total, COUNT(*) as count FROM financings WHERE status!='cancelled' GROUP BY type`);
    const byProgram = await pool.query(`SELECT program, SUM(amount) as total FROM financings WHERE status!='cancelled' AND program IS NOT NULL GROUP BY program`);
    const monthly   = await pool.query(`SELECT DATE_TRUNC('month', receipt_date) as month, SUM(amount) as total FROM financings WHERE status!='cancelled' GROUP BY month ORDER BY month DESC LIMIT 12`);
    const totals    = await pool.query(`SELECT COALESCE(SUM(amount),0) as grand_total, COUNT(*) as count FROM financings WHERE status!='cancelled'`);
    res.json({ byType: byType.rows, byProgram: byProgram.rows, monthly: monthly.rows, totals: totals.rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
};
