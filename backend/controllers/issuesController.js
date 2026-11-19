const pool = require('../config/db');

const DAILY_FINE_RATE = parseFloat(process.env.DAILY_FINE_RATE || '10'); // currency units/day
const LOAN_DAYS = 14;

function daysBetween(a, b) {
  const ms = new Date(b) - new Date(a);
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

exports.getIssuedBooks = async (req, res) => {
  try {
    const userId = req.user.role === 'admin' && req.query.all === 'true' ? null : req.user.user_id;

    let query = `
      SELECT ib.issue_id, ib.issue_date, ib.due_date, ib.return_date, ib.status, ib.fine_amount,
             b.book_id, b.title, b.cover_color, a.author_name,
             br.rating AS user_rating, br.review AS user_review,
             u.user_id, u.name AS user_name
      FROM issued_books ib
      JOIN books b ON ib.book_id = b.book_id
      JOIN authors a ON b.author_id = a.author_id
      JOIN users u ON ib.user_id = u.user_id
      LEFT JOIN book_ratings br ON br.issue_id = ib.issue_id AND br.user_id = ib.user_id
    `;
    const params = [];
    if (userId) {
      query += ' WHERE ib.user_id = ?';
      params.push(userId);
    }
    query += ' ORDER BY ib.due_date ASC';

    const [rows] = await pool.query(query, params);

    const today = new Date();
    const enriched = rows.map((r) => {
      let status = r.status;
      let remaining_days = daysBetween(today, r.due_date);
      let fine = parseFloat(r.fine_amount);

      if (status === 'active') {
        if (new Date(r.due_date) < today) {
          status = 'overdue';
          const overdueDays = daysBetween(r.due_date, today);
          fine = overdueDays * DAILY_FINE_RATE;
          remaining_days = -overdueDays;
        } else {
          remaining_days = daysBetween(today, r.due_date);
        }
      }
      return { ...r, status, remaining_days, fine_amount: fine };
    });

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch issued books' });
  }
};

exports.issueBook = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const userId = req.user.user_id;
    const { book_id } = req.body;

    await conn.beginTransaction();

    const [existing] = await conn.query(
      'SELECT issue_id FROM issued_books WHERE user_id = ? AND book_id = ? AND status IN ("active","overdue")',
      [userId, book_id]
    );
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(409).json({ error: 'You already have this book issued' });
    }

    const [bookRows] = await conn.query(
      'SELECT available_copies FROM books WHERE book_id = ? AND is_active = TRUE FOR UPDATE',
      [book_id]
    );
    if (bookRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Book not found' });
    }
    if (bookRows[0].available_copies < 1) {
      await conn.rollback();
      return res.status(400).json({ error: 'No available copies of this book' });
    }

    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + LOAN_DAYS);

    const [result] = await conn.query(
      'INSERT INTO issued_books (user_id, book_id, issue_date, due_date, status) VALUES (?, ?, ?, ?, "active")',
      [userId, book_id, issueDate.toISOString().slice(0, 10), dueDate.toISOString().slice(0, 10)]
    );

    await conn.query('UPDATE books SET available_copies = available_copies - 1 WHERE book_id = ?', [book_id]);

    await conn.query("UPDATE reservations SET status = 'fulfilled' WHERE user_id = ? AND book_id = ? AND status = 'ready' LIMIT 1", [userId, book_id]);

    await conn.query(
      'INSERT INTO reading_history (user_id, book_id, start_date, reading_status, progress_percent) VALUES (?, ?, ?, "reading", 0)',
      [userId, book_id, issueDate.toISOString().slice(0, 10)]
    );

    await conn.commit();
    res.status(201).json({ issue_id: result.insertId, due_date: dueDate.toISOString().slice(0, 10), message: 'Book issued successfully' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Failed to issue book' });
  } finally {
    conn.release();
  }
};

exports.returnBook = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const issueId = req.params.id;

    await conn.beginTransaction();

    const [rows] = await conn.query('SELECT * FROM issued_books WHERE issue_id = ? FOR UPDATE', [issueId]);
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Issue record not found' });
    }
    const issue = rows[0];
    if (req.user.role !== 'admin' && issue.user_id !== req.user.user_id) {
      await conn.rollback();
      return res.status(403).json({ error: 'You can only return your own books' });
    }
    if (issue.status === 'returned') {
      await conn.rollback();
      return res.status(400).json({ error: 'Book already returned' });
    }

    const today = new Date();
    const overdueDays = daysBetween(issue.due_date, today);
    const fine = overdueDays > 0 ? overdueDays * DAILY_FINE_RATE : 0;

    await conn.query(
      'UPDATE issued_books SET status = "returned", return_date = ?, fine_amount = ? WHERE issue_id = ?',
      [today.toISOString().slice(0, 10), fine, issueId]
    );

    await conn.query(
      `UPDATE books b SET b.available_copies = GREATEST(0, b.total_copies - (
         SELECT COUNT(*) FROM issued_books active_issue
         WHERE active_issue.book_id = b.book_id AND active_issue.status IN ('active','overdue')
       )) WHERE b.book_id = ?`,
      [issue.book_id]
    );

    const [nextReservation] = await conn.query(
      "SELECT reservation_id FROM reservations WHERE book_id = ? AND status = 'queued' ORDER BY created_at ASC LIMIT 1 FOR UPDATE",
      [issue.book_id]
    );
    if (nextReservation.length) {
      await conn.query("UPDATE reservations SET status = 'ready', notified_at = NOW() WHERE reservation_id = ?", [nextReservation[0].reservation_id]);
    }

    await conn.query(
      'UPDATE reading_history SET reading_status = "completed", completion_date = ?, progress_percent = 100 WHERE user_id = ? AND book_id = ? AND reading_status = "reading"',
      [today.toISOString().slice(0, 10), issue.user_id, issue.book_id]
    );

    if (fine > 0) {
      await conn.query(
        'INSERT INTO billing (user_id, issue_id, amount, payment_status, reason) VALUES (?, ?, ?, "unpaid", ?)',
        [issue.user_id, issueId, fine, 'Overdue fine']
      );
    }

    await conn.commit();
    res.json({ message: 'Book returned successfully', fine_amount: fine });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Failed to return book' });
  } finally {
    conn.release();
  }
};

exports.rateReturnedBook = async (req, res) => {
  try {
    const issueId = Number(req.params.id);
    const rating = Number(req.body.rating);
    const review = String(req.body.review || '').trim().slice(0, 500) || null;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be a whole number from 1 to 5' });
    }
    const [issues] = await pool.query(
      'SELECT issue_id, user_id, book_id, status FROM issued_books WHERE issue_id = ?',
      [issueId]
    );
    if (!issues.length) return res.status(404).json({ error: 'Issue record not found' });
    const issue = issues[0];
    if (req.user.role !== 'admin' && issue.user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'You can only rate your own returned books' });
    }
    if (issue.status !== 'returned') return res.status(400).json({ error: 'Return the book before rating it' });
    await pool.query(
      `INSERT INTO book_ratings (issue_id, user_id, book_id, rating, review)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), review = VALUES(review)`,
      [issueId, issue.user_id, issue.book_id, rating, review]
    );
    await pool.query(
      `UPDATE books b SET b.rating = (SELECT ROUND(AVG(r.rating), 1) FROM book_ratings r WHERE r.book_id = b.book_id)
       WHERE b.book_id = ?`,
      [issue.book_id]
    );
    res.json({ message: 'Thank you for rating this book', rating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save rating' });
  }
};
