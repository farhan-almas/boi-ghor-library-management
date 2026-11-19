const pool = require('../config/db');

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [[stats]] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM issued_books WHERE user_id = ? AND status IN ('active','overdue')) AS books_issued,
         (SELECT COUNT(*) FROM reading_history WHERE user_id = ? AND reading_status = 'completed') AS books_read,
         (SELECT COUNT(*) FROM issued_books WHERE user_id = ? AND status = 'active'
            AND due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)) AS due_soon,
         (SELECT COALESCE(SUM(amount),0) FROM billing WHERE user_id = ? AND payment_status != 'paid') AS outstanding_fine`,
      [userId, userId, userId, userId]
    );

    const [currentReading] = await pool.query(
      `SELECT rh.history_id, rh.progress_percent, b.book_id, b.title, b.cover_color, b.cover_image,
              a.author_name, d.department_name, ib.due_date
       FROM reading_history rh
       JOIN books b ON rh.book_id = b.book_id
       JOIN authors a ON b.author_id = a.author_id
       JOIN departments d ON b.department_id = d.department_id
       LEFT JOIN issued_books ib ON ib.user_id = rh.user_id AND ib.book_id = rh.book_id AND ib.status IN ('active','overdue')
       WHERE rh.user_id = ? AND rh.reading_status = 'reading'
       ORDER BY rh.start_date DESC LIMIT 5`,
      [userId]
    );

    const [recentlyRead] = await pool.query(
      `SELECT rh.history_id, rh.completion_date, b.book_id, b.title, b.cover_color, b.cover_image, a.author_name
       FROM reading_history rh
       JOIN books b ON rh.book_id = b.book_id
       JOIN authors a ON b.author_id = a.author_id
       WHERE rh.user_id = ? AND rh.reading_status = 'completed'
       ORDER BY rh.completion_date DESC LIMIT 5`,
      [userId]
    );

    const [upcomingDue] = await pool.query(
      `SELECT ib.issue_id, ib.due_date, ib.status, b.title
       FROM issued_books ib
       JOIN books b ON ib.book_id = b.book_id
       WHERE ib.user_id = ? AND ib.status IN ('active','overdue')
       ORDER BY ib.due_date ASC LIMIT 6`,
      [userId]
    );

    const today = new Date();
    const upcomingWithStatus = upcomingDue.map((row) => {
      const due = new Date(row.due_date);
      const diffDays = Math.floor((due - today) / (1000 * 60 * 60 * 24));
      let display_status = 'On Time';
      if (diffDays < 0) display_status = 'Overdue';
      else if (diffDays <= 3) display_status = 'Due Soon';
      return { ...row, display_status };
    });

    res.json({
      stats,
      current_reading: currentReading,
      recently_read: recentlyRead,
      upcoming_due: upcomingWithStatus,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

exports.getWishlist = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT w.wishlist_id, b.book_id, b.title, b.cover_color, b.cover_image, a.author_name
     FROM wishlist w
     JOIN books b ON w.book_id = b.book_id
     JOIN authors a ON b.author_id = a.author_id
     WHERE w.user_id = ? AND b.is_active = TRUE
     ORDER BY w.added_at DESC`,
    [req.user.user_id]
  );
  res.json(rows);
};

exports.addToWishlist = async (req, res) => {
  try {
    await pool.query('INSERT IGNORE INTO wishlist (user_id, book_id) VALUES (?, ?)', [
      req.user.user_id,
      req.body.book_id,
    ]);
    res.status(201).json({ message: 'Added to wishlist' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
};


exports.removeFromWishlist = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM wishlist WHERE wishlist_id = ? AND user_id = ?',
      [req.params.id, req.user.user_id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Wishlist item not found' });
    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove wishlist item' });
  }
};
