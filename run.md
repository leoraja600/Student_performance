# 🚀 Running the Student Performance Analyzer

Follow these steps to set up and run the environment locally.

## 🛠 Prerequisites
- **Node.js**: >= 18.x
- **SQLite**: (No setup needed as Prisma handles the `.db` file locally)

---

## 1. Backend Setup (API)

```powershell
# From the backend directory
cd backend
npm install

# Initialize database schema
npx prisma db push

# Initial Seed: Creates 'admin@college.edu' and 'faculty@college.edu'
npm run seed

# Settings Seed: Initializes scoring weights (40/40/20)
node src/utils/seedSettings.js

# Start the server (Dev Mode)
npm run dev
```
*The API will be available at: http://localhost:5000*

---

## 2. Frontend Setup (UI)

```powershell
# From the frontend directory
cd frontend
npm install

# Start the Vite development server
npm run dev
```
*The UI will be available at: http://localhost:5173*

---

## 👥 Default Login Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@college.edu` | (From your `backend/.env` file or `Admin@123456`) |
| **Faculty** | `faculty@college.edu` | `Faculty@123` |

---

## 📥 (Optional) Import Student Data
If you have a CSV with student details:
```powershell
# From the project root
cd backend
node src/utils/import_csv.js ../stud.csv
```

---

## 🐳 Running with Docker (Alternative)
```powershell
docker-compose up --build
```
