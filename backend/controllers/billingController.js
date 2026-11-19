const pool = require('../config/db');

exports.getBilling = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [history] = await pool.query(
      `SELECT bi.billing_id, bi.amount, bi.payment_status, bi.payment_date, bi.reason, bi.created_at,
              b.title AS book_title
       FROM billing bi
       JOIN issued_books ib ON bi.issue_id = ib.issue_id
       JOIN books b ON ib.book_id = b.book_id
       WHERE bi.user_id = ?
       ORDER BY bi.created_at DESC`,
      [userId]
    );

    const [[summary]] = await pool.query(
      `SELECT
         COALESCE(SUM(amount), 0) AS total_fine,
         COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END), 0) AS paid_amount,
         COALESCE(SUM(CASE WHEN payment_status != 'paid' THEN amount ELSE 0 END), 0) AS outstanding_amount
       FROM billing WHERE user_id = ?`,
      [userId]
    );

    const [[lastPayment]] = await pool.query(
      `SELECT payment_date, amount FROM payments WHERE user_id = ? ORDER BY payment_date DESC LIMIT 1`,
      [userId]
    );

    res.json({
      summary: {
        total_fine: parseFloat(summary.total_fine),
        paid_amount: parseFloat(summary.paid_amount),
        outstanding_amount: parseFloat(summary.outstanding_amount),
        last_payment: lastPayment || null,
      },
      history,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch billing data' });
  }
};

exports.payFine = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const userId = req.user.user_id;
    const billingId = req.params.id;

    await conn.beginTransaction();

    const [rows] = await conn.query(
      'SELECT * FROM billing WHERE billing_id = ? AND user_id = ? FOR UPDATE',
      [billingId, userId]
    );
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Billing record not found' });
    }
    const bill = rows[0];
    if (bill.payment_status === 'paid') {
      await conn.rollback();
      return res.status(400).json({ error: 'Fine already paid' });
    }

    await conn.query(
      'UPDATE billing SET payment_status = "paid", payment_date = CURDATE() WHERE billing_id = ?',
      [billingId]
    );

    await conn.query(
      'INSERT INTO payments (user_id, billing_id, amount, payment_method) VALUES (?, ?, ?, ?)',
      [userId, billingId, bill.amount, 'Simulated Payment']
    );

    await conn.commit();
    res.json({ message: 'Fine paid successfully' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Failed to process payment' });
  } finally {
    conn.release();
  }
};


exports.checkout = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const userId = req.user.user_id;
    const billingIds = Array.isArray(req.body.billing_ids) ? req.body.billing_ids.map(Number).filter(Boolean) : [];
    const paymentMethod = req.body.payment_method || 'Simulated Payment';

    if (!billingIds.length) return res.status(400).json({ error: 'Select at least one unpaid invoice' });
    await conn.beginTransaction();

    const placeholders = billingIds.map(() => '?').join(',');
    const [rows] = await conn.query(
      `SELECT * FROM billing WHERE user_id = ? AND billing_id IN (${placeholders}) AND payment_status != 'paid' FOR UPDATE`,
      [userId, ...billingIds]
    );
    if (rows.length !== billingIds.length) {
      await conn.rollback();
      return res.status(400).json({ error: 'One or more invoices are invalid or already paid' });
    }

    const total = rows.reduce((sum, r) => sum + Number(r.amount), 0);
    await conn.query(
      `UPDATE billing SET payment_status='paid', payment_date=CURDATE() WHERE user_id=? AND billing_id IN (${placeholders})`,
      [userId, ...billingIds]
    );
    for (const row of rows) {
      await conn.query(
        'INSERT INTO payments (user_id, billing_id, amount, payment_method) VALUES (?, ?, ?, ?)',
        [userId, row.billing_id, row.amount, paymentMethod]
      );
    }
    await conn.commit();
    res.json({ message: 'Checkout completed successfully', amount: total, payment_method: paymentMethod });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Checkout failed' });
  } finally {
    conn.release();
  }
};
