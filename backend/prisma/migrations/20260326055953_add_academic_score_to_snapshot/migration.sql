-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "studentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rollNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "leetcodeUsername" TEXT NOT NULL,
    "hackerrankUsername" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "weeklyGoal" INTEGER NOT NULL DEFAULT 10,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "internal_assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "marks" REAL NOT NULL,
    "totalMarks" REAL NOT NULL DEFAULT 100,
    "term" TEXT,
    "semester" INTEGER,
    "examDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "internal_assessments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "performance_snapshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "leetcodeTotalSolved" INTEGER NOT NULL DEFAULT 0,
    "leetcodeEasySolved" INTEGER NOT NULL DEFAULT 0,
    "leetcodeMediumSolved" INTEGER NOT NULL DEFAULT 0,
    "leetcodeHardSolved" INTEGER NOT NULL DEFAULT 0,
    "leetcodeContestRating" REAL,
    "leetcodeGlobalRank" INTEGER,
    "leetcodeAttended" INTEGER NOT NULL DEFAULT 0,
    "hackerrankTotalSolved" INTEGER NOT NULL DEFAULT 0,
    "hackerrankScore" REAL NOT NULL DEFAULT 0,
    "topTopics" TEXT,
    "academicScore" REAL NOT NULL DEFAULT 0,
    "combinedScore" REAL NOT NULL DEFAULT 0,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "performance_snapshots_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fetch_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "duration" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fetch_logs_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_studentId_key" ON "users"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "students_rollNumber_key" ON "students"("rollNumber");

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_leetcodeUsername_key" ON "students"("leetcodeUsername");

-- CreateIndex
CREATE UNIQUE INDEX "students_hackerrankUsername_key" ON "students"("hackerrankUsername");

-- CreateIndex
CREATE INDEX "internal_assessments_studentId_term_idx" ON "internal_assessments"("studentId", "term");

-- CreateIndex
CREATE INDEX "performance_snapshots_studentId_fetchedAt_idx" ON "performance_snapshots"("studentId", "fetchedAt");

-- CreateIndex
CREATE INDEX "fetch_logs_studentId_createdAt_idx" ON "fetch_logs"("studentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "app_settings_key_key" ON "app_settings"("key");
