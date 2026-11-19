# BOI GHOR — Digital Library

BOI GHOR is a full-stack library management system built with React, Vite, Tailwind CSS, Node.js, Express, and MySQL.

## Included in this archive

```text
boi-ghor-project/
├── frontend/    React + Vite user interface
├── backend/     Express REST API and authentication
├── database/    MySQL schema and sample data
└── README.md    Setup and usage instructions
```

Generated dependencies, build output, local environment files, database credentials, and runtime secrets are intentionally excluded.

## Main features

- Student and administrator authentication with JWT role protection.
- Book catalogue, department browsing, Explore search, wishlist, notices, billing, and checkout demo flow.
- Four-story library locations with floor, almirah, and shelf codes.
- Book availability tracking based on active and overdue issue records.
- Student issue history, return workflow, post-return ratings, and reviews.
- Book reservations with queue positions and automatic promotion after a return.
- Due-date, overdue, and reservation-ready notifications.
- Administrator dashboard for books, departments, users, notices, analytics, issue tracking, book-level borrower details, user-level issue details, and reservation waiting lines.
- Cover images through URLs or uploaded image data for this course/demo implementation.

## Requirements

- Node.js 18 or newer
- npm
- MySQL 8 or MariaDB-compatible server

## 1. Create the database

Create the database and seed data by running the SQL file from a MySQL client:

```bash
mysql -u root -p < database/schema.sql
```

The schema creates the `lull_pathagar` database and its tables. If your MySQL user or password differs from the defaults, use the appropriate command for your environment.

## 2. Configure and start the backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set the database values and a long JWT secret:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=lull_pathagar
JWT_SECRET=replace_with_a_long_random_secret
DAILY_FINE_RATE=10
```

Install dependencies and start the API:

```bash
npm install
npm start
```

The backend runs at `http://localhost:5000`.

The backend refreshes the demo administrator on startup using `ADMIN_*` values from `.env.example` or `.env`. Change these values before using the project outside a demo environment.

## 3. Configure and start the frontend

In a second terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The frontend uses:

```env
VITE_API_URL=http://localhost:5000/api
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

## Demo accounts

Student:

- Email: `jubayer@lullpathagar.edu`
- Password: `password`

Administrator:

- Email: `admin@lullpathagar.edu`
- Password: `password`

Change these credentials before any real deployment.

## Important routes

Student routes include `/`, `/books`, `/books?mode=locator`, `/explore`, `/issued`, `/wishlist`, `/billing`, `/checkout`, `/notices`, and `/settings`.

Administrator routes include `/admin-login` and `/admin`. In the administrator dashboard, use **Issue Tracking** to expand a book and see its borrowers, issue dates, due dates, return dates, and statuses. Use **Waiting Lines** to see active reservation queues.

## Production notes

This is a course-project/demo application. The checkout flow is not connected to a real payment gateway. Cover uploads are stored as data URLs in MySQL for simplicity; production deployments should use object storage and store only stable image URLs. Use strong secrets, managed database credentials, HTTPS, backups, and a proper deployment process for production.

## Project structure

- `frontend/src/` — React pages, components, layouts, API client, and styles.
- `backend/controllers/` — authentication, books, issues, reservations, admin, notices, billing, and analytics logic.
- `backend/routes/` — Express route definitions.
- `backend/middleware/` — JWT authentication and administrator authorization.
- `database/schema.sql` — database schema and sample seed data.
