const pool = require('../config/db');

exports.getAllDepartments = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT d.department_id, d.department_name, d.description,
             COUNT(b.book_id) AS book_count
      FROM departments d
      LEFT JOIN books b ON d.department_id = b.department_id AND b.is_active = TRUE
      GROUP BY d.department_id
      ORDER BY d.department_name ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { department_name, description } = req.body;
    const [result] = await pool.query(
      'INSERT INTO departments (department_name, description) VALUES (?, ?)',
      [department_name, description || null]
    );
    res.status(201).json({ department_id: result.insertId, message: 'Department created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create department' });
  }
};

exports.updateDepartment = async (req,res) => {
  try {
    const { department_name, description } = req.body;
    if(!department_name) return res.status(400).json({error:'Department name is required'});
    const [r]=await pool.query('UPDATE departments SET department_name=?, description=? WHERE department_id=?',[department_name,description||null,req.params.id]);
    if(!r.affectedRows) return res.status(404).json({error:'Department not found'});
    res.json({message:'Department updated'});
  } catch(e){ console.error(e); res.status(500).json({error:'Failed to update department'}); }
};
exports.deleteDepartment = async (req,res) => {
  try {
    const [[c]]=await pool.query('SELECT COUNT(*) count FROM books WHERE department_id=? AND is_active=TRUE',[req.params.id]);
    if(c.count>0) return res.status(409).json({error:'Cannot delete a department containing active books'});
    const [r]=await pool.query('DELETE FROM departments WHERE department_id=?',[req.params.id]);
    if(!r.affectedRows) return res.status(404).json({error:'Department not found'});
    res.json({message:'Department deleted'});
  } catch(e){ console.error(e); res.status(500).json({error:'Failed to delete department'}); }
};
