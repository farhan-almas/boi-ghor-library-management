-- ============================================================
-- LULL PATHAGAR — Online Library Management System
-- Database Schema + Sample Data
-- ============================================================

CREATE DATABASE IF NOT EXISTS boi_ghor_db
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE boi_ghor_db;
-- ------------------------------------------------------------
-- TABLE: users
-- ------------------------------------------------------------
CREATE TABLE users (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100)   NOT NULL,
    email         VARCHAR(150)   NOT NULL UNIQUE,
    password      VARCHAR(255)   NOT NULL,
    phone         VARCHAR(20),
    role          ENUM('student','admin') NOT NULL DEFAULT 'student',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- TABLE: departments
-- ------------------------------------------------------------
CREATE TABLE departments (
    department_id   INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    description      TEXT
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- TABLE: authors
-- ------------------------------------------------------------
CREATE TABLE authors (
    author_id     INT AUTO_INCREMENT PRIMARY KEY,
    author_name   VARCHAR(150) NOT NULL,
    biography     TEXT
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- TABLE: books
-- ------------------------------------------------------------
CREATE TABLE books (
    book_id            INT AUTO_INCREMENT PRIMARY KEY,
    title              VARCHAR(255) NOT NULL,
    isbn               VARCHAR(20)  NOT NULL UNIQUE,
    author_id          INT NOT NULL,
    department_id      INT NOT NULL,
    publisher          VARCHAR(150),
    publication_year SMALLINT,
    description        TEXT,
    total_copies       INT NOT NULL DEFAULT 1,
    available_copies   INT NOT NULL DEFAULT 1,
    rating             DECIMAL(2,1) DEFAULT 4.0,
    cover_color        VARCHAR(20) DEFAULT '#6366f1',
    cover_image        LONGTEXT NULL,
    location_code      VARCHAR(20) NULL,
    is_active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE RESTRICT,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE RESTRICT,
    INDEX idx_title (title),
    INDEX idx_isbn (isbn),
    INDEX idx_department (department_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- TABLE: issued_books
-- ------------------------------------------------------------
CREATE TABLE issued_books (
    issue_id      INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL,
    book_id       INT NOT NULL,
    issue_date    DATE NOT NULL,
    due_date      DATE NOT NULL,
    return_date   DATE NULL,
    status        ENUM('active','returned','overdue') NOT NULL DEFAULT 'active',
    fine_amount   DECIMAL(8,2) DEFAULT 0.00,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,
    INDEX idx_user_status (user_id, status)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- TABLE: reservations
-- ------------------------------------------------------------
CREATE TABLE reservations (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT NOT NULL,
    book_id        INT NOT NULL,
    status         ENUM('queued','ready','cancelled','fulfilled') NOT NULL DEFAULT 'queued',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notified_at    TIMESTAMP NULL,
    UNIQUE KEY uniq_active_reservation (user_id, book_id, status),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,
    INDEX idx_book_queue (book_id, status, created_at)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- TABLE: book_ratings
-- ------------------------------------------------------------
CREATE TABLE book_ratings (
    rating_id      INT AUTO_INCREMENT PRIMARY KEY,
    issue_id       INT NOT NULL,
    user_id        INT NOT NULL,
    book_id        INT NOT NULL,
    rating         TINYINT NOT NULL,
    review         VARCHAR(500),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_issue_rating (issue_id, user_id),
    FOREIGN KEY (issue_id) REFERENCES issued_books(issue_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- TABLE: reading_history
-- ------------------------------------------------------------
CREATE TABLE reading_history (
    history_id       INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT NOT NULL,
    book_id          INT NOT NULL,
    start_date       DATE,
    completion_date  DATE,
    reading_status   ENUM('reading','completed') NOT NULL DEFAULT 'reading',
    progress_percent INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- TABLE: wishlist
-- ------------------------------------------------------------
CREATE TABLE wishlist (
    wishlist_id  INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    book_id      INT NOT NULL,
    added_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,
    UNIQUE KEY uniq_user_book (user_id, book_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- TABLE: billing
-- ------------------------------------------------------------
CREATE TABLE billing (
    billing_id      INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    issue_id        INT NOT NULL,
    amount          DECIMAL(8,2) NOT NULL,
    payment_status  ENUM('paid','unpaid','pending') NOT NULL DEFAULT 'unpaid',
    payment_date    DATE NULL,
    reason          VARCHAR(255) DEFAULT 'Overdue fine',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (issue_id) REFERENCES issued_books(issue_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- TABLE: payments
-- ------------------------------------------------------------
CREATE TABLE payments (
    payment_id      INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    billing_id      INT NOT NULL,
    amount          DECIMAL(8,2) NOT NULL,
    payment_method  VARCHAR(50) DEFAULT 'Simulated Card',
    payment_date    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (billing_id) REFERENCES billing(billing_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- TABLE: notices
-- ------------------------------------------------------------
CREATE TABLE notices (
    notice_id     INT AUTO_INCREMENT PRIMARY KEY,
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    category      ENUM('important','general','events') NOT NULL DEFAULT 'general',
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- SAMPLE DATA
-- ============================================================

INSERT INTO departments (department_name, description) VALUES
('Computer Science', 'Programming, algorithms, and software engineering'),
('Engineering', 'Mechanical, civil, and electrical engineering texts'),
('Mathematics', 'Pure and applied mathematics'),
('Physics', 'Classical and modern physics'),
('Chemistry', 'Organic, inorganic and physical chemistry'),
('Business', 'Management, entrepreneurship and finance'),
('Economics', 'Micro and macroeconomics'),
('Literature', 'Fiction, poetry and literary criticism'),
('History', 'World and regional history'),
('General Knowledge', 'Reference and general-interest reading');

INSERT INTO authors (author_name, biography) VALUES
('Robert C. Martin', 'Software engineer known for Clean Code and Agile practices.'),
('Thomas H. Cormen', 'Computer scientist, co-author of Introduction to Algorithms.'),
('Andrew S. Tanenbaum', 'Computer scientist specializing in operating systems and networks.'),
('James Gosling', 'Creator of the Java programming language.'),
('Stephen Hawking', 'Theoretical physicist and cosmologist.'),
('Richard Feynman', 'Theoretical physicist, Nobel laureate.'),
('Paul Krugman', 'Economist and Nobel laureate in Economics.'),
('Adam Smith', 'Philosopher and pioneer of political economy.'),
('George Orwell', 'Novelist and essayist.'),
('Jane Austen', 'English novelist known for romantic fiction.'),
('Yuval Noah Harari', 'Historian and author of Sapiens.'),
('Michio Kaku', 'Theoretical physicist and science communicator.'),
('Peter Drucker', 'Management consultant, educator, and author.'),
('Robert Kiyosaki', 'Entrepreneur and author of Rich Dad Poor Dad.'),
('Malcolm Gladwell', 'Journalist and author.'),
('Chinua Achebe', 'Nigerian novelist, poet, and critic.'),
('Carl Sagan', 'Astronomer and science communicator.'),
('Donald Knuth', 'Computer scientist, author of The Art of Computer Programming.'),
('Eric Ries', 'Entrepreneur, author of The Lean Startup.'),
('Yaa Gyasi', 'Novelist known for historical fiction.');

INSERT INTO books (title, isbn, author_id, department_id, publisher, publication_year, description, total_copies, available_copies, rating, cover_color) VALUES
('Clean Code', '9780132350884', 1, 1, 'Prentice Hall', 2008, 'A handbook of agile software craftsmanship.', 5, 3, 4.7, '#6366f1'),
('Introduction to Algorithms', '9780262033848', 2, 1, 'MIT Press', 2009, 'Comprehensive textbook on algorithms.', 4, 2, 4.8, '#8b5cf6'),
('Modern Operating Systems', '9780133591620', 3, 1, 'Pearson', 2014, 'In-depth coverage of OS design.', 3, 1, 4.5, '#3b82f6'),
('The Java Programming Language', '9780321349804', 4, 1, 'Addison-Wesley', 2005, 'Definitive guide to Java.', 4, 4, 4.3, '#06b6d4'),
('The Art of Computer Programming Vol 1', '9780201896831', 18, 1, 'Addison-Wesley', 1997, 'Fundamental algorithms.', 2, 1, 4.9, '#6366f1'),
('The Lean Startup', '9780307887894', 19, 6, 'Crown Business', 2011, 'How constant innovation creates radically successful businesses.', 5, 5, 4.4, '#f59e0b'),
('Engineering Mechanics', '9788120345926', 3, 2, 'PHI Learning', 2016, 'Statics and dynamics for engineers.', 4, 2, 4.1, '#10b981'),
('Structural Analysis', '9780134610672', 3, 2, 'Pearson', 2017, 'Fundamentals of structural analysis.', 3, 3, 4.0, '#10b981'),
('Concepts of Modern Physics', '9781259064561', 6, 4, 'McGraw-Hill', 2017, 'Foundations of quantum and relativistic physics.', 4, 2, 4.6, '#ef4444'),
('A Brief History of Time', '9780553380163', 5, 4, 'Bantam', 1998, 'A landmark exploration of the universe.', 6, 4, 4.8, '#ef4444'),
('Astrophysics for People in a Hurry', '9780393609394', 17, 4, 'Norton', 2017, 'A quick, accessible tour of astrophysics.', 5, 5, 4.5, '#ef4444'),
('Physics of the Impossible', '9780307278821', 12, 4, 'Anchor', 2008, 'What sci-fi tech could really work.', 3, 2, 4.4, '#ef4444'),
('Organic Chemistry', '9780078021558', 7, 5, 'McGraw-Hill', 2015, 'Comprehensive organic chemistry text.', 3, 1, 4.0, '#f97316'),
('Principles of Economics', '9781305585126', 7, 7, 'Cengage', 2017, 'Foundational economics textbook.', 4, 4, 4.2, '#eab308'),
('The Wealth of Nations', '9780486408968', 8, 7, 'Dover', 1776, 'Classic treatise on political economy.', 3, 2, 4.3, '#eab308'),
('Freakonomics', '9780060731335', 15, 7, 'William Morrow', 2005, 'A rogue economist explores the hidden side of everything.', 5, 3, 4.5, '#eab308'),
('1984', '9780451524935', 9, 8, 'Signet Classic', 1949, 'Dystopian classic of surveillance and control.', 6, 3, 4.9, '#ec4899'),
('Pride and Prejudice', '9780141439518', 10, 8, 'Penguin Classics', 1813, 'Classic romantic novel of manners.', 5, 5, 4.7, '#ec4899'),
('Things Fall Apart', '9780385474542', 16, 8, 'Anchor', 1958, 'A story of pre-colonial Nigeria.', 4, 2, 4.6, '#ec4899'),
('Homegoing', '9781101971062', 20, 8, 'Vintage', 2016, 'A multigenerational saga tracing two family lines.', 3, 3, 4.6, '#ec4899'),
('Sapiens: A Brief History of Humankind', '9780062316097', 11, 9, 'Harper', 2015, 'A sweeping history of the human species.', 6, 4, 4.8, '#14b8a6'),
('Guns, Germs, and Steel', '9780393317558', 11, 9, 'Norton', 1997, 'Fates of human societies explained.', 4, 2, 4.5, '#14b8a6'),
('Cosmos', '9780345539434', 17, 10, 'Ballantine', 1980, 'A personal voyage through science and civilization.', 4, 3, 4.7, '#84cc16'),
('The Innovators', '9781476708706', 15, 1, 'Simon & Schuster', 2014, 'How a group of inventors created the digital revolution.', 3, 2, 4.4, '#6366f1'),
('Management: Tasks, Responsibilities, Practices', '9780060110982', 13, 6, 'Harper Business', 1973, 'Foundational management text.', 3, 3, 4.1, '#f59e0b'),
('Rich Dad Poor Dad', '9781612680194', 14, 6, 'Plata Publishing', 1997, 'What the rich teach their kids about money.', 5, 3, 4.3, '#f59e0b'),
('Outliers', '9780316017930', 15, 8, 'Little, Brown', 2008, 'The story of success.', 4, 4, 4.5, '#ec4899'),
('Calculus: Early Transcendentals', '9781285741550', 2, 3, 'Cengage', 2015, 'Comprehensive calculus textbook.', 4, 2, 4.2, '#a855f7'),
('Linear Algebra and Its Applications', '9780321982384', 2, 3, 'Pearson', 2015, 'Core linear algebra concepts.', 3, 1, 4.3, '#a855f7'),
('Discrete Mathematics and Its Applications', '9780073383095', 2, 3, 'McGraw-Hill', 2011, 'Discrete math for computer science.', 4, 3, 4.4, '#a855f7');

INSERT INTO users (name, email, password, phone, role) VALUES
-- Demo password for both seeded users is "password". Change these credentials before deployment.
('Farhan Almas Sharif', 'farhan.almas.sharif@gmail.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '01700000000', 'student'),
('Admin User', 'admin@lullpathagar.edu', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '01800000000', 'admin');

INSERT INTO issued_books (user_id, book_id, issue_date, due_date, return_date, status, fine_amount) VALUES
(1, 1, '2026-08-01', '2026-08-15', NULL, 'active', 0.00),
(1, 9, '2026-08-05', '2026-08-19', NULL, 'active', 0.00),
(1, 2, '2026-07-01', '2026-07-15', '2026-07-14', 'returned', 0.00),
(1, 21, '2026-07-20', '2026-08-03', NULL, 'overdue', 190.00);

INSERT INTO reading_history (user_id, book_id, start_date, completion_date, reading_status, progress_percent) VALUES
(1, 2, '2026-07-01', '2026-07-14', 'completed', 100),
(1, 17, '2026-06-01', '2026-06-20', 'completed', 100),
(1, 22, '2026-05-10', '2026-05-25', 'completed', 100),
(1, 1, '2026-08-01', NULL, 'reading', 45),
(1, 9, '2026-08-05', NULL, 'reading', 20);

INSERT INTO wishlist (user_id, book_id) VALUES
(1, 6), (1, 24), (1, 27);

INSERT INTO billing (user_id, issue_id, amount, payment_status, payment_date, reason) VALUES
(1, 4, 190.00, 'unpaid', NULL, 'Overdue fine — Sapiens: A Brief History of Humankind');

INSERT INTO notices (title, description, category, is_active) VALUES
('Library Closed for Eid Holiday', 'The library will remain closed from the 10th to the 13th for the holiday.', 'important', TRUE),
('New Arrivals in Computer Science', 'Ten new titles including updated editions of classic algorithms texts have arrived.', 'general', TRUE),
('Return Reminder', 'Please return overdue books to avoid accumulating further fines.', 'important', TRUE),
('Book Fair Event', 'Join us for the annual campus book fair next month featuring guest authors.', 'events', TRUE),
('Scheduled Maintenance', 'The online portal will be briefly unavailable for maintenance this weekend.', 'general', TRUE),
('Fine Payment Reminder', 'Outstanding fines should be settled before the end of the semester.', 'important', TRUE);
