const pool = require('../config/db');

exports.getNotices = async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM notices WHERE is_active = TRUE';
    const params = [];
    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }
    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notices' });
  }
};

exports.createNotice = async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const [result] = await pool.query(
      'INSERT INTO notices (title, description, category) VALUES (?, ?, ?)',
      [title, description, category || 'general']
    );
    res.status(201).json({ notice_id: result.insertId, message: 'Notice created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create notice' });
  }
};

exports.updateNotice = async (req,res) => {
  try {
    const {title,description,category,is_active}=req.body;
    const [r]=await pool.query('UPDATE notices SET title=?,description=?,category=?,is_active=? WHERE notice_id=?',[title,description||null,category||'general',is_active===undefined?true:is_active,req.params.id]);
    if(!r.affectedRows) return res.status(404).json({error:'Notice not found'});
    res.json({message:'Notice updated'});
  } catch(e){ console.error(e); res.status(500).json({error:'Failed to update notice'}); }
};
exports.deleteNotice = async (req,res) => {
  try {
    const [r]=await pool.query('UPDATE notices SET is_active=FALSE WHERE notice_id=?',[req.params.id]);
    if(!r.affectedRows) return res.status(404).json({error:'Notice not found'});
    res.json({message:'Notice archived'});
  } catch(e){ console.error(e); res.status(500).json({error:'Failed to archive notice'}); }
};
