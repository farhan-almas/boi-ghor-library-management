const pool = require('../config/db');

const LOCATION_PATTERN = /^[1-4]-[A-Z]-[1-9]\d*$/;

const BASE_SELECT = `
  SELECT b.book_id, b.title, b.isbn, b.publisher, b.publication_year, b.description,
         b.total_copies, b.available_copies, b.rating, b.cover_color, b.cover_image, b.location_code, b.is_active,
         a.author_id, a.author_name,
         d.department_id, d.department_name
  FROM books b
  JOIN authors a ON b.author_id = a.author_id
  JOIN departments d ON b.department_id = d.department_id
`;

exports.getAllBooks = async (req, res) => {
  try {
    const { search, department, author, availability, sort, year_from, year_to } = req.query;
    const clauses = ['b.is_active = TRUE'];
    const params = [];

    if (search) {
      clauses.push('(b.title LIKE ? OR a.author_name LIKE ? OR b.isbn LIKE ? OR d.department_name LIKE ? OR b.location_code LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like, like, like);
    }
    if (department) {
      clauses.push('d.department_id = ?');
      params.push(department);
    }
    if (author) {
      clauses.push('a.author_id = ?');
      params.push(author);
    }
    if (year_from && Number.isInteger(Number(year_from))) {
      clauses.push('b.publication_year >= ?');
      params.push(Number(year_from));
    }
    if (year_to && Number.isInteger(Number(year_to))) {
      clauses.push('b.publication_year <= ?');
      params.push(Number(year_to));
    }
    if (availability === 'available') {
      clauses.push('b.available_copies > 0');
    } else if (availability === 'unavailable') {
      clauses.push('b.available_copies = 0');
    }

    let query = BASE_SELECT;
    if (clauses.length) query += ' WHERE ' + clauses.join(' AND ');

    const sortMap = {
      title_asc: 'b.title ASC',
      title_desc: 'b.title DESC',
      rating_desc: 'b.rating DESC',
      year_desc: 'b.publication_year DESC',
    };
    query += ` ORDER BY ${sortMap[sort] || 'b.title ASC'}`;

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
};

exports.getYearDistribution = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT publication_year AS year, COUNT(*) AS count
       FROM books
       WHERE is_active = TRUE AND publication_year IS NOT NULL
       GROUP BY publication_year
       ORDER BY publication_year ASC`
    );
    res.json(rows.map((row) => ({ ...row, year: Number(row.year), count: Number(row.count) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch publication years' });
  }
};

exports.getBookById = async (req, res) => {
  try {
    const [rows] = await pool.query(`${BASE_SELECT} WHERE b.book_id = ? AND b.is_active = TRUE`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Book not found' });

    const book = rows[0];
    const [activeIssue] = await pool.query(
      `SELECT issue_id, due_date FROM issued_books
       WHERE user_id = ? AND book_id = ? AND status IN ('active', 'overdue')
       LIMIT 1`,
      [req.user.user_id, book.book_id]
    );
    const [similar] = await pool.query(
      `${BASE_SELECT} WHERE b.department_id = ? AND b.book_id != ? AND b.is_active = TRUE LIMIT 4`,
      [book.department_id, book.book_id]
    );
    res.json({ ...book, is_issued: activeIssue.length > 0, active_issue: activeIssue[0] || null, similar_books: similar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
};

exports.createBook = async (req, res) => {
  try {
    const { title, isbn, author_id, department_id, publisher, publication_year,
            description, total_copies, cover_color, cover_image, location_code } = req.body;
    if (!title || !isbn || !author_id || !department_id || Number(total_copies) < 1) {
      return res.status(400).json({ error: 'Title, ISBN, author, department and at least 1 copy are required' });
    }
    if (location_code && !LOCATION_PATTERN.test(String(location_code).toUpperCase())) {
      return res.status(400).json({ error: 'Location must use floor-section-shelf format, for example 3-B-15' });
    }
    const normalizedLocation = location_code ? String(location_code).toUpperCase() : null;
    const [result] = await pool.query(
      `INSERT INTO books (title, isbn, author_id, department_id, publisher, publication_year,
                           description, total_copies, available_copies, cover_color, cover_image, location_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, isbn, author_id, department_id, publisher, publication_year,
       description, total_copies, total_copies, cover_color || '#6366f1',
       cover_image || null, normalizedLocation]
    );
    res.status(201).json({ book_id: result.insertId, message: 'Book created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create book' });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const totalCopies = req.body.total_copies === undefined ? undefined : Number(req.body.total_copies);
    const availableCopies = req.body.available_copies === undefined ? undefined : Number(req.body.available_copies);
    if ((totalCopies !== undefined && (!Number.isInteger(totalCopies) || totalCopies < 0)) ||
        (availableCopies !== undefined && (!Number.isInteger(availableCopies) || availableCopies < 0))) {
      return res.status(400).json({ error: 'Copy counts must be whole numbers of zero or more' });
    }
    if (totalCopies !== undefined && availableCopies !== undefined && availableCopies > totalCopies) {
      return res.status(400).json({ error: 'Available copies cannot exceed total copies' });
    }
    if (req.body.location_code && !LOCATION_PATTERN.test(String(req.body.location_code).toUpperCase())) {
      return res.status(400).json({ error: 'Location must use floor-section-shelf format, for example 3-B-15' });
    }
    const normalizedLocation = req.body.location_code ? String(req.body.location_code).toUpperCase() : req.body.location_code;
    const fields = ['title', 'isbn', 'author_id', 'department_id', 'publisher',
                     'publication_year', 'description', 'total_copies', 'available_copies', 'cover_color', 'cover_image', 'location_code', 'is_active'];
    const updates = [];
    const params = [];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        params.push(f === 'total_copies' ? totalCopies : f === 'available_copies' ? availableCopies : f === 'location_code' ? normalizedLocation : req.body[f]);
      }
    });
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id);
    const [result] = await pool.query(`UPDATE books SET ${updates.join(', ')} WHERE book_id = ?`, params);
    if (!result.affectedRows) return res.status(404).json({ error: 'Book not found' });
    res.json({ message: 'Book updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update book' });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const [result] = await pool.query('UPDATE books SET is_active = FALSE WHERE book_id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Book not found' });
    res.json({ message: 'Book archived successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete book' });
  }
};

// Explore: recommendations, popular, new arrivals, random
exports.getExplore = async (req, res) => {
  try {
    const userId = req.user.user_id;

    
    const [recentDepartments] = await pool.query(
      `SELECT b.department_id
       FROM reading_history rh
       JOIN books b ON rh.book_id = b.book_id
       WHERE rh.user_id = ?
       GROUP BY b.department_id
       ORDER BY MAX(rh.start_date) DESC
       LIMIT 2`,
      [userId]
    );

    const deptIds = recentDepartments.map((d) => d.department_id);

    let recommended = [];
    if (deptIds.length) {
      const placeholders = deptIds.map(() => '?').join(',');
      const [rows] = await pool.query(
        `${BASE_SELECT} WHERE b.is_active = TRUE AND b.department_id IN (${placeholders}) ORDER BY b.rating DESC LIMIT 6`,
        deptIds
      );
      recommended = rows;
    } else {
      const [rows] = await pool.query(`${BASE_SELECT} WHERE b.is_active = TRUE ORDER BY b.rating DESC LIMIT 6`);
      recommended = rows;
    }

    
    const [popular] = await pool.query(
  `SELECT b.book_id, b.title, a.author_name, d.department_name,
          b.cover_color, b.cover_image,
          COUNT(ib.issue_id) AS issue_count
   FROM books b
   JOIN authors a ON b.author_id = a.author_id
   JOIN departments d ON b.department_id = d.department_id
   LEFT JOIN issued_books ib ON b.book_id = ib.book_id
   WHERE b.is_active = TRUE
   GROUP BY b.book_id, b.title, a.author_name, d.department_name, b.cover_color, b.cover_image
   ORDER BY issue_count DESC
   LIMIT 6`
);


    const [newArrivals] = await pool.query(`${BASE_SELECT} WHERE b.is_active = TRUE ORDER BY b.created_at DESC LIMIT 6`);

    const [randomPick] = await pool.query(`${BASE_SELECT} WHERE b.is_active = TRUE ORDER BY RAND() LIMIT 1`);

    res.json({
      recommended,
      based_on_recent: recommended,
      popular,
      new_arrivals: newArrivals,
      random_pick: randomPick[0] || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch explore data' });
  }
};

exports.getRandomBook = async (req, res) => {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE b.is_active = TRUE ORDER BY RAND() LIMIT 1`);
  res.json(rows[0] || null);
};
