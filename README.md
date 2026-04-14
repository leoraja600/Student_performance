# Student Performance Analyzer

> A full-stack web application that tracks and compares student coding performance on **LeetCode** and **HackerRank** in real time, with a combined leaderboard, admin panel, and progress charts.

---

## 📋 Features

- **Real Data Only** — LeetCode via GraphQL API, HackerRank via Playwright scraping
- **Hackathon Verification** — Students submit hackathons (with proof) for admin/faculty review
- **Leaderboard** — Combined score (normalized 0–100), sortable & filterable
- **Global Analytics** — Admin/Faculty view of class-wide trends, top performers, and "at-risk" students
- **Student Dashboard** — Per-student stats with badges, streaks, and historical progress charts
- **Admin Panel** — Full student management, sync triggering, fetch logs, and system settings
- **Scheduled Sync** — Auto-refresh all students every 6 hours (node-cron) with worker pool
- **JWT Auth** — Role-based (`admin` / `faculty` / `student`) with protected routes and roll-number fallback
- **Swagger Docs** — API documentation at `/api/docs`
- **Winston Logging** — Rotating log files for all fetch events

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express (ES modules) |
| Database | SQLite + Prisma ORM (No setup required) |
| Frontend | React (Vite) + Tailwind CSS + Chart.js |
| Scraping | Playwright (HackerRank) + Axios/GraphQL (LeetCode) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Scheduling | node-cron |
| Containerization | Docker + docker-compose |

---

## 💻 Local Development (Quick Start)

### Prerequisites
- Node.js >= 18

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env — set JWT_SECRET and ADMIN_PASSWORD
npm install

# Initialize Database & Settings
npx prisma db push
node src/utils/seedSettings.js   # Initializes scoring weights
node src/utils/seedAdmin.js      # Creates admin@college.edu / admin123
npm run dev                      # Start API on port 5000
```

### 2. Bulk Import Students (Optional)
If you have a `stud.csv` in the root:
```bash
# From backend directory
node src/utils/import_csv.js ../stud.csv
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev                      # Starts Vite on port 5173
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | required |
| `JWT_SECRET` | Secret for signing JWTs (min 32 chars) | required |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `PORT` | Backend port | `5000` |
| `ADMIN_EMAIL` | Default admin email | `admin@college.edu` |
| `ADMIN_PASSWORD` | Default admin password | required |
| `LEETCODE_MAX_SCORE` | Max LC problems for score normalisation | `300` |
| `LEETCODE_WEIGHT` | LC weight in combined score (0–100) | `50` |
| `HACKERRANK_MAX_SCORE` | Max HR problems for score normalisation | `500` |
| `HACKERRANK_WEIGHT` | HR weight in combined score (0–100) | `50` |
| `LC_REQUEST_DELAY` | Delay (ms) between LeetCode requests | `1500` |
| `HR_CACHE_TTL_MINUTES` | HackerRank cache TTL in minutes | `60` |
| `CRON_SCHEDULE` | cron expression for auto-sync | `0 */6 * * *` |
| `CRON_ENABLED` | Enable/disable scheduled sync | `true` |
| `LOG_LEVEL` | Winston log level | `info` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `/api` |

---

## 👤 First Login

1. Open `http://localhost` (Docker) or `http://localhost:5173` (dev)
2. Log in with the admin credentials from your `.env`:
   - Email: `ADMIN_EMAIL`
   - Password: `ADMIN_PASSWORD`

---

## 📚 Adding Students (Admin Panel)

1. Log in as admin
2. Navigate to **Manage Students** → **Add Student**
3. Fill in:
   - Roll Number (e.g. `CS2021001`)
   - Full Name
   - Email (used as login)
   - LeetCode Username
   - HackerRank Username
   - Password (student's login password)
4. Optionally enable **Validate Usernames** to verify the accounts exist before saving
5. Click **Create Student**

The student can then log in with their email and password to see their dashboard.

---

## 🔄 Manual Data Refresh

### For a specific student
- **Admin Panel:** Click the refresh (↺) icon next to any student in the Manage Students table
- **Student Dashboard:** Click the "Refresh My Stats" button
- **API:** `POST /api/students/refresh/:studentId` (with JWT token)

### For all students
- **Admin Dashboard:** Click "Sync All Students"
- **API:** `POST /api/admin/sync` (admin JWT required)

### Trigger the cron job manually (dev)
```bash
# From backend directory
node -e "import('./src/services/dataSync.js').then(m => m.syncAllStudents())"
```

---

## 📖 API Documentation

Interactive Swagger UI available at: **http://localhost:5000/api/docs**

### Key Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | JWT | Get current user |
| GET | `/api/students` | Admin | List all students |
| POST | `/api/students` | Admin | Create student |
| PUT | `/api/students/:id` | Admin | Update student |
| DELETE | `/api/students/:id` | Admin | Deactivate student |
| POST | `/api/students/refresh/:id` | JWT (own or admin) | Manual refresh |
| GET | `/api/students/:id/history` | JWT (own or admin) | Performance history |
| GET | `/api/leaderboard` | JWT | Sorted leaderboard |
| POST | `/api/admin/sync` | Admin | Sync all students |
| GET | `/api/admin/stats` | Admin | System stats |
| GET | `/api/admin/logs` | Admin | Fetch logs |

---

## 🏗 Project Structure

```
st_project/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # DB schema
│   ├── src/
│   │   ├── controllers/           # Route handlers
│   │   ├── routes/                # API routes + Swagger docs
│   │   ├── services/
│   │   │   ├── leetcodeFetcher.js # LeetCode GraphQL
│   │   │   ├── hackerrankScraper.js # Playwright scraper
│   │   │   └── dataSync.js        # Orchestration + scoring
│   │   ├── jobs/syncJob.js        # Cron schedule
│   │   ├── middleware/            # Auth, error handler
│   │   ├── utils/                 # Logger, config, Prisma
│   │   ├── app.js                 # Express setup
│   │   └── server.js              # Entry point
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/            # Sidebar, UI, Modal, etc.
│   │   ├── context/               # AuthContext
│   │   ├── pages/                 # Dashboard, Leaderboard, Admin
│   │   └── services/api.js        # Axios client
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🔐 Security Notes

- JWT secrets must be at minimum 32 characters
- No hardcoded secrets — all via env vars
- Rate limiting: 200 req/15 min per IP
- Helmet.js security headers
- Input validation on all endpoints
- Passwords hashed with bcrypt (salt rounds: 12)

---

## ⚡ Scoring Formula (Dynamic)

```
Combined Score (0-100) =
  (leetcode_solved / LEETCODE_MAX) × LEETCODE_WEIGHT [40%]
  + (hackerrank_solved / HACKERRANK_MAX) × HACKERRANK_WEIGHT [40%]
  + (hackathon_count / HACKATHON_MAX) × HACKATHON_WEIGHT [20%]
```

**⚠️ IMPORTANT:** Unlike earlier versions, these weights are now **stored in the database** and can be adjusted in real-time via the **Admin Portal → System Settings** page. Changes take effect immediately across all calculations.

---

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| HackerRank scraper fails | Profile may be private; check `HR_CACHE_TTL_MINUTES` |
| LeetCode returns 429 | Increase `LC_REQUEST_DELAY` to 3000+ ms |
| DB connection error | Verify `DATABASE_URL` and that PostgreSQL is running |
| Playwright crashes | In Docker, Chromium path is auto-configured; locally run `npx playwright install chromium` |
| Admin seed fails | Check `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars |
