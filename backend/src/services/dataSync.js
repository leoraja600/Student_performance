import prisma from '../utils/prisma.js';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { fetchLeetcodeStats } from './leetcodeFetcher.js';
import { fetchHackerrankStats } from './hackerrankScraper.js';

/**
 * Calculate combined score (0-100) based on configured weights
 */
export function calculateCombinedScore(leetcodeDetails, hackerrankTotal, hackathonCount, customWeights = null) {
  const weights = customWeights || config.scoring;
  const { leetcodeMax, leetcodeWeight, hackerrankMax, hackerrankWeight, hackathonMax, hackathonWeight } = weights;
  
  // LeetCode Weighted Score (Easy: 20, Medium: 30, Hard: 50)
  const { easy = 0, medium = 0, hard = 0 } = leetcodeDetails;
  const leetcodePoints = (easy * 20) + (medium * 30) + (hard * 50);
  
  const lcScore = Math.min(leetcodePoints / leetcodeMax, 1) * leetcodeWeight;
  const hrScore = Math.min(hackerrankTotal / hackerrankMax, 1) * hackerrankWeight;
  const hkScore = Math.min(hackathonCount / hackathonMax, 1) * hackathonWeight;
  
  return parseFloat((lcScore + hrScore + hkScore).toFixed(2));
}

async function getActiveWeights() {
  try {
    const settings = await prisma.appSettings.findMany();
    const map = settings.reduce((acc, s) => ({ ...acc, [s.key]: parseFloat(s.value) }), {});
    
    return {
      leetcodeMax: map.LEETCODE_MAX_SCORE || config.scoring.leetcodeMax,
      leetcodeWeight: map.LEETCODE_WEIGHT || config.scoring.leetcodeWeight,
      hackerrankMax: map.HACKERRANK_MAX_SCORE || config.scoring.hackerrankMax,
      hackerrankWeight: map.HACKERRANK_WEIGHT || config.scoring.hackerrankWeight,
      hackathonMax: map.HACKATHON_MAX_SCORE || config.scoring.hackathonMax,
      hackathonWeight: map.HACKATHON_WEIGHT || config.scoring.hackathonWeight,
    };
  } catch (err) {
    logger.warn(`[DataSync] Failed to fetch settings, using defaults: ${err.message}`);
    return config.scoring;
  }
}

/**
 * Semaphore-based concurrency limiter
 */
async function plimit(concurrency, tasks) {
  const results = [];
  const running = new Set();
  const queue = [...tasks];

  return new Promise((resolve) => {
    const next = async () => {
      if (queue.length === 0 && running.size === 0) {
        return resolve(results);
      }

      while (running.size < concurrency && queue.length > 0) {
        const task = queue.shift();
        const promise = task().then((res) => {
          running.delete(promise);
          results.push(res);
          next();
        });
        running.add(promise);
      }
    };
    next();
  });
}

/**
 * Fetch and store performance data for a single student
 */
export async function fetchAndStoreStudentData(studentId, customWeights = null, retryCount = 0) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new Error(`Student not found`);

  const activeWeights = customWeights || await getActiveWeights();

  logger.info(`[DataSync] Syncing: ${student.name} (${student.rollNumber}) [Attempt: ${retryCount + 1}]`);

  let leetcodeData = null, hackerrankData = null, lcError = null, hrError = null;

  try {
    leetcodeData = await fetchLeetcodeStats(student.leetcodeUsername);
    await prisma.fetchLog.create({
      data: { studentId, platform: 'LEETCODE', status: 'SUCCESS', message: `Solved: ${leetcodeData.totalSolved}`, duration: leetcodeData.duration },
    });
  } catch (error) {
    lcError = error.message;
    await prisma.fetchLog.create({ data: { studentId, platform: 'LEETCODE', status: 'FAILED', message: lcError } });
    
    // Check if it's a rate limit (429) hit
    if (lcError.includes('429') || lcError.includes('Rate limited')) {
       if (retryCount < 2) {
         const delay = Math.pow(2, retryCount + 1) * 5000; // Exponential backoff: 10s, 20s
         logger.warn(`[DataSync] LeetCode Rate Limit for ${student.name}. Retrying in ${delay / 1000}s...`);
         await new Promise(r => setTimeout(r, delay));
         return fetchAndStoreStudentData(studentId, activeWeights, retryCount + 1);
       }
    }
  }

  try {
    hackerrankData = await fetchHackerrankStats(student.hackerrankUsername);
    await prisma.fetchLog.create({
      data: { studentId, platform: 'HACKERRANK', status: hackerrankData.fromCache ? 'SKIPPED' : 'SUCCESS', message: `Solved: ${hackerrankData.totalSolved}`, duration: hackerrankData.duration },
    });
  } catch (error) {
    hrError = error.message;
    await prisma.fetchLog.create({ data: { studentId, platform: 'HACKERRANK', status: 'FAILED', message: hrError } });
  }

  // Calculate verified hackathon score from individual hackathon records
  const POSITION_SCORES = { WINNER: 10, RUNNER_UP: 7, TOP_5: 5, PARTICIPANT: 3 };
  const verifiedHackathons = await prisma.hackathon.findMany({
    where: { studentId, status: 'VERIFIED' },
  });
  const hackathonScoreTotal = verifiedHackathons.reduce(
    (sum, h) => sum + (POSITION_SCORES[h.position] || 0), 0
  );

  const snapshotData = {
    studentId,
    leetcodeTotalSolved: leetcodeData?.totalSolved ?? 0,
    leetcodeEasySolved: leetcodeData?.easySolved ?? 0,
    leetcodeMediumSolved: leetcodeData?.mediumSolved ?? 0,
    leetcodeHardSolved: leetcodeData?.hardSolved ?? 0,
    leetcodeContestRating: leetcodeData?.contestRating ?? null,
    leetcodeGlobalRank: leetcodeData?.globalRank ?? null,
    leetcodeAttended: leetcodeData?.attendedContests ?? 0,
    hackerrankTotalSolved: hackerrankData?.totalSolved ?? 0,
    hackerrankScore: hackerrankData?.score ?? 0,
    hackathonScore: hackathonScoreTotal,
    topTopics: JSON.stringify([...(leetcodeData?.topics || []), ...(hackerrankData?.topics || [])]),
    combinedScore: calculateCombinedScore(
      { 
        easy: leetcodeData?.easySolved ?? 0, 
        medium: leetcodeData?.mediumSolved ?? 0, 
        hard: leetcodeData?.hardSolved ?? 0 
      }, 
      hackerrankData?.totalSolved ?? 0, 
      hackathonScoreTotal,
      activeWeights
    ),
  };

  if (lcError && hrError) {
    await prisma.fetchLog.create({ data: { studentId, platform: 'COMBINED', status: 'FAILED', message: `Failed: ${lcError}` } });
    throw new Error(`Platforms failed`);
  }

  return await prisma.performanceSnapshot.create({ data: snapshotData });
}

/**
 * Fetch and store performance data for all active students with Parallel Worker Pool
 */
export async function syncAllStudents() {
  const students = await prisma.student.findMany({ where: { isActive: true } });
  
  // Shuffle to prevent predictable platform hits
  const shuffledStudents = students.sort(() => Math.random() - 0.5);
  const activeWeights = await getActiveWeights();
  
  // Concurrency config: 10 concurrent syncs for 400 students
  const CONCURRENCY = students.length > 100 ? 12 : 6;
  
  logger.info(`[DataSync] STARTING MASSIVE SYNC: ${students.length} students (Workers: ${CONCURRENCY})`);

  const results = { total: students.length, success: 0, failed: 0, errors: [] };
  
  // Generate tasks for each student
  const tasks = shuffledStudents.map((student) => async () => {
    try {
      // Base jitter (adds 1-4 seconds delay per student to mimic human browsing)
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 3000));
      
      await fetchAndStoreStudentData(student.id, activeWeights);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({ name: student.name, error: error.message });
      logger.error(`[DataSync] Critical Failure for ${student.name}: ${error.message}`);
    }
  });

  // Execute using worker pool
  const startTime = Date.now();
  await plimit(CONCURRENCY, tasks);
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  logger.info(`[DataSync] SYNC FINISHED: ${results.success} Successful | ${results.failed} Failed | Duration: ${duration}min`);
  
  return results;
}
