const pool = require('../config/db');

exports.getMyReservation = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.reservation_id, r.book_id, r.status, r.created_at, b.title,
              (SELECT COUNT(*) + 1 FROM reservations r2 WHERE r2.book_id = r.book_id AND r2.status = 'queued' AND r2.created_at < r.created_at) AS queue_position
       FROM reservations r JOIN books b ON b.book_id = r.book_id
       WHERE r.user_id = ? AND r.book_id = ? AND r.status IN ('queued','ready')
       ORDER BY r.created_at DESC LIMIT 1`,
      [req.user.user_id, req.params.bookId]
    );
    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load reservation' });
  }
};

exports.createReservation = async (req, res) => {
  try {
    const bookId = Number(req.body.book_id);
    const [books] = await pool.query('SELECT book_id, title, available_copies FROM books WHERE book_id = ? AND is_active = TRUE', [bookId]);
    if (!books.length) return res.status(404).json({ error: 'Book not found' });
    if (books[0].available_copies > 0) return res.status(400).json({ error: 'This book is available now — issue it instead' });
    const [existing] = await pool.query("SELECT reservation_id FROM reservations WHERE user_id = ? AND book_id = ? AND status IN ('queued','ready')", [req.user.user_id, bookId]);
    if (existing.length) return res.status(409).json({ error: 'You already have an active reservation for this book' });
    const [result] = await pool.query("INSERT INTO reservations (user_id, book_id, status) VALUES (?, ?, 'queued')", [req.user.user_id, bookId]);
    res.status(201).json({ reservation_id: result.insertId, message: 'You are now in the reservation queue' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reserve book' });
  }
};

exports.cancelReservation = async (req, res) => {
  try {
    const [result] = await pool.query("UPDATE reservations SET status = 'cancelled' WHERE reservation_id = ? AND user_id = ? AND status IN ('queued','ready')", [req.params.id, req.user.user_id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Active reservation not found' });
    res.json({ message: 'Reservation cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel reservation' });
  }
};

exports.getReminders = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ib.issue_id, ib.book_id, ib.due_date, b.title,
              DATEDIFF(ib.due_date, CURRENT_DATE()) AS days_remaining
       FROM issued_books ib JOIN books b ON b.book_id = ib.book_id
       WHERE ib.user_id = ? AND ib.status IN ('active','overdue')
         AND ib.due_date <= DATE_ADD(CURRENT_DATE(), INTERVAL 3 DAY)
       ORDER BY ib.due_date ASC`,
      [req.user.user_id]
    );
    const [readyReservations] = await pool.query(
      `SELECT r.reservation_id AS issue_id, r.book_id, r.created_at AS due_date, b.title
       FROM reservations r JOIN books b ON b.book_id = r.book_id
       WHERE r.user_id = ? AND r.status = 'ready' ORDER BY r.notified_at DESC`,
      [req.user.user_id]
    );
    res.json([
      ...readyReservations.map((row) => ({ ...row, type: 'reservation_ready', days_remaining: null })),
      ...rows.map((row) => ({ ...row, type: Number(row.days_remaining) < 0 ? 'overdue' : 'due_soon' })),
    ]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load reminders' });
  }
};

exports.getAdminQueues = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.reservation_id, r.book_id, r.user_id, r.status, r.created_at, r.notified_at,
              b.title, b.available_copies, u.name AS user_name, u.email,
              (SELECT COUNT(*) + 1 FROM reservations r2 WHERE r2.book_id = r.book_id AND r2.status = 'queued' AND r2.created_at < r.created_at) AS queue_position
       FROM reservations r JOIN books b ON b.book_id = r.book_id JOIN users u ON u.user_id = r.user_id
       WHERE r.status IN ('queued','ready') ORDER BY r.book_id, r.created_at`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load reservation queues' });
  }
};
