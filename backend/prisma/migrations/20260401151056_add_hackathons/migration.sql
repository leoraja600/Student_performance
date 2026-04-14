/*
  Warnings:

  - You are about to drop the `internal_assessments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `academicScore` on the `performance_snapshots` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "internal_assessments_studentId_term_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "internal_assessments";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_performance_snapshots" (
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
    "hackathonScore" REAL NOT NULL DEFAULT 0,
    "topTopics" TEXT,
    "combinedScore" REAL NOT NULL DEFAULT 0,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "performance_snapshots_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_performance_snapshots" ("combinedScore", "fetchedAt", "hackerrankScore", "hackerrankTotalSolved", "id", "leetcodeAttended", "leetcodeContestRating", "leetcodeEasySolved", "leetcodeGlobalRank", "leetcodeHardSolved", "leetcodeMediumSolved", "leetcodeTotalSolved", "studentId", "topTopics") SELECT "combinedScore", "fetchedAt", "hackerrankScore", "hackerrankTotalSolved", "id", "leetcodeAttended", "leetcodeContestRating", "leetcodeEasySolved", "leetcodeGlobalRank", "leetcodeHardSolved", "leetcodeMediumSolved", "leetcodeTotalSolved", "studentId", "topTopics" FROM "performance_snapshots";
DROP TABLE "performance_snapshots";
ALTER TABLE "new_performance_snapshots" RENAME TO "performance_snapshots";
CREATE INDEX "performance_snapshots_studentId_fetchedAt_idx" ON "performance_snapshots"("studentId", "fetchedAt");
CREATE TABLE "new_students" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rollNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "leetcodeUsername" TEXT NOT NULL,
    "hackerrankUsername" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "weeklyGoal" INTEGER NOT NULL DEFAULT 10,
    "hackathonCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_students" ("createdAt", "email", "hackerrankUsername", "id", "isActive", "leetcodeUsername", "name", "rollNumber", "updatedAt", "weeklyGoal") SELECT "createdAt", "email", "hackerrankUsername", "id", "isActive", "leetcodeUsername", "name", "rollNumber", "updatedAt", "weeklyGoal" FROM "students";
DROP TABLE "students";
ALTER TABLE "new_students" RENAME TO "students";
CREATE UNIQUE INDEX "students_rollNumber_key" ON "students"("rollNumber");
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");
CREATE UNIQUE INDEX "students_leetcodeUsername_key" ON "students"("leetcodeUsername");
CREATE UNIQUE INDEX "students_hackerrankUsername_key" ON "students"("hackerrankUsername");
CREATE INDEX "students_name_idx" ON "students"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
