const pool = require('../config/db');
const bcrypt = require('bcrypt');

exports.getUsers = async (req,res) => {
  try {
    const [rows] = await pool.query(`SELECT user_id,name,email,phone,role,created_at FROM users ORDER BY created_at DESC`);
    res.json(rows);
  } catch(e){ console.error(e); res.status(500).json({error:'Failed to fetch users'}); }
};

exports.updateUserRole = async (req,res) => {
  try {
    const role = req.body.role;
    if (!['student','admin'].includes(role)) return res.status(400).json({error:'Invalid role'});
    if (Number(req.params.id) === req.user.user_id && role !== 'admin') return res.status(400).json({error:'You cannot remove your own admin role'});
    const [r] = await pool.query('UPDATE users SET role=? WHERE user_id=?',[role,req.params.id]);
    if(!r.affectedRows) return res.status(404).json({error:'User not found'});
    res.json({message:'User role updated'});
  } catch(e){ console.error(e); res.status(500).json({error:'Failed to update user'}); }
};

exports.createAuthor = async (req,res) => {
  try {
    if(!req.body.author_name) return res.status(400).json({error:'Author name is required'});
    const [r]=await pool.query('INSERT INTO authors(author_name,biography) VALUES(?,?)',[req.body.author_name,req.body.biography||null]);
    res.status(201).json({author_id:r.insertId,message:'Author created'});
  } catch(e){ console.error(e); res.status(500).json({error:'Failed to create author'}); }
};

exports.getAuthors = async (req,res) => {
  try { const [r]=await pool.query('SELECT * FROM authors ORDER BY author_name'); res.json(r); }
  catch(e){ res.status(500).json({error:'Failed to fetch authors'}); }
};
