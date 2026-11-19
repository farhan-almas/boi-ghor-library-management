const pool = require('../config/db');

exports.getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Books read per month (last 6 months)
    const [monthly] = await pool.query(
      `SELECT DATE_FORMAT(completion_date, '%Y-%m') AS month, COUNT(*) AS count
       FROM reading_history
       WHERE user_id = ? AND reading_status = 'completed' AND completion_date IS NOT NULL
         AND completion_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY month ORDER BY month ASC`,
      [userId]
    );

    // Reading distribution by department
    const [byCategory] = await pool.query(
      `SELECT d.department_name, COUNT(*) AS count
       FROM reading_history rh
       JOIN books b ON rh.book_id = b.book_id
       JOIN departments d ON b.department_id = d.department_id
       WHERE rh.user_id = ?
       GROUP BY d.department_name
       ORDER BY count DESC`,
      [userId]
    );

    const [[totals]] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM reading_history WHERE user_id = ? AND reading_status = 'completed') AS total_read,
         (SELECT COUNT(*) FROM issued_books WHERE user_id = ?) AS total_issued,
         (SELECT COUNT(*) FROM reading_history WHERE user_id = ? AND reading_status = 'completed'
            AND MONTH(completion_date) = MONTH(CURDATE()) AND YEAR(completion_date) = YEAR(CURDATE())) AS books_this_month,
         (SELECT COUNT(*) FROM reading_history WHERE user_id = ? AND reading_status = 'completed'
            AND YEAR(completion_date) = YEAR(CURDATE())) AS books_this_year`,
      [userId, userId, userId, userId]
    );

    const [[favoriteCategory]] = await pool.query(
      `SELECT d.department_name, COUNT(*) AS count
       FROM reading_history rh
       JOIN books b ON rh.book_id = b.book_id
       JOIN departments d ON b.department_id = d.department_id
       WHERE rh.user_id = ?
       GROUP BY d.department_name ORDER BY count DESC LIMIT 1`,
      [userId]
    );

    res.json({
      reading_activity: monthly,
      reading_categories: byCategory,
      monthly_reading: monthly,
      most_read_categories: byCategory,
      statistics: {
        total_books_read: totals.total_read,
        total_books_issued: totals.total_issued,
        favorite_category: favoriteCategory?.department_name || 'N/A',
        books_this_month: totals.books_this_month,
        books_this_year: totals.books_this_year,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

exports.getAdminAnalytics = async (req, res) => {
  try {
    const [[totals]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM books) AS total_books,
        (SELECT COUNT(*) FROM users WHERE role = 'student') AS total_users,
        (SELECT COUNT(*) FROM issued_books WHERE status IN ('active','overdue')) AS currently_issued,
        (SELECT COUNT(*) FROM issued_books WHERE status = 'overdue'
           OR (status = 'active' AND due_date < CURDATE())) AS overdue_books,
        (SELECT COALESCE(SUM(amount),0) FROM billing WHERE payment_status != 'paid') AS total_fines
    `);

    const [monthlyIssues] = await pool.query(`
      SELECT DATE_FORMAT(issue_date, '%Y-%m') AS month, COUNT(*) AS count
      FROM issued_books
      WHERE issue_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month ORDER BY month ASC
    `);

    const [borrowedCategories] = await pool.query(`
      SELECT d.department_name, COUNT(*) AS count
      FROM issued_books ib
      JOIN books b ON ib.book_id = b.book_id
      JOIN departments d ON b.department_id = d.department_id
      GROUP BY d.department_name ORDER BY count DESC LIMIT 6
    `);

    const [popularBooks] = await pool.query(`
      SELECT b.title, COUNT(ib.issue_id) AS issue_count
      FROM books b
      LEFT JOIN issued_books ib ON b.book_id = ib.book_id
      GROUP BY b.book_id ORDER BY issue_count DESC LIMIT 5
    `);

    res.json({
      totals,
      monthly_issues: monthlyIssues,
      most_borrowed_categories: borrowedCategories,
      popular_books: popularBooks,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch admin analytics' });
  }
};
