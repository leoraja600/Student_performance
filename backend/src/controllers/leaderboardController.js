import prisma from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import { syncAllStudents } from '../services/dataSync.js';
import { getCronStatus } from '../jobs/syncJob.js';

/**
 * GET /api/leaderboard - Get sorted leaderboard
 */
export const getLeaderboard = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search = '', sortBy = 'combinedScore', sortDir = 'desc', onlyHackathons = 'false' } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { rollNumber: { contains: search } },
        ],
      }),
      ...(onlyHackathons === 'true' && {
        snapshots: {
          some: {
            hackathonScore: { gt: 0 }
          }
        }
      })
    };

    // Fetch all active students matching the filter
    const students = await prisma.student.findMany({
      where,
      include: {
        snapshots: {
          orderBy: { fetchedAt: 'desc' },
          take: 1,
        },
      },
    });

    // Build the mapped leaderboard for ALL students
    let leaderboard = students.map((student) => {
      const latest = student.snapshots[0] || {};
      return {
        studentId: student.id,
        rollNumber: student.rollNumber,
        name: student.name || student.email.split('@')[0],
        leetcodeUsername: student.leetcodeUsername,
        hackerrankUsername: student.hackerrankUsername,
        leetcodeTotalSolved: latest.leetcodeTotalSolved || 0,
        leetcodeContestRating: latest.leetcodeContestRating || 0,
        hackerrankTotalSolved: latest.hackerrankTotalSolved || 0,
        hackathonScore: latest.hackathonScore || 0,
        hackathonCount: student.hackathonCount || 0,
        combinedScore: latest.combinedScore || 0,
        lastUpdated: latest.fetchedAt || null,
      };
    });

    // Robust numerical sorting
    leaderboard.sort((a, b) => {
      const valA = Number(a[sortBy]) || 0;
      const valB = Number(b[sortBy]) || 0;
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });

    // Assign absolute ranks after sorting
    leaderboard = leaderboard.map((entry, index) => ({ ...entry, rank: index + 1 }));

    const total = leaderboard.length;
    const paginatedLeaderboard = leaderboard.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: paginatedLeaderboard,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/sync - Trigger sync for all students (admin)
 */
export const triggerSync = async (req, res, next) => {
  try {
    logger.info('[Admin] Manual full sync triggered');

    // Respond immediately and run sync in background
    res.json({
      success: true,
      message: 'Data sync started in the background. Check fetch logs for progress.',
    });

    // Run sync asynchronously
    syncAllStudents().catch((err) => {
      logger.error(`[Admin] Background sync error: ${err.message}`);
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/stats - Get system overview stats
 */
export const getSystemStats = async (req, res, next) => {
  try {
    const [totalStudents, totalSnapshots, recentLogs] = await Promise.all([
      prisma.student.count({ where: { isActive: true } }),
      prisma.performanceSnapshot.count(),
      prisma.fetchLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          student: { select: { name: true, rollNumber: true } },
        },
      }),
    ]);

    const logStats = await prisma.fetchLog.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const cronStatus = getCronStatus();

    res.json({
      success: true,
      data: {
        totalStudents,
        totalSnapshots,
        recentLogs,
        logStats: logStats.reduce((acc, curr) => {
          acc[curr.status] = curr._count.status;
          return acc;
        }, {}),
        cronStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/logs - Get all fetch logs (with pagination)
 */
export const getAllLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, platform, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(platform && { platform }),
      ...(status && { status }),
    };

    const [logs, total] = await Promise.all([
      prisma.fetchLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          student: { select: { name: true, rollNumber: true } },
        },
      }),
      prisma.fetchLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};
/**
 * GET /api/admin/analytics - Get aggregate analytics for the entire student body
 */
export const getOverallAnalytics = async (req, res, next) => {
  try {
    const students = await prisma.student.findMany({
      where: { isActive: true },
      include: { snapshots: { orderBy: { fetchedAt: 'desc' }, take: 1 } },
    });

    const snapshots = students.filter(s => s.snapshots.length > 0).map(s => ({ ...s.snapshots[0], name: s.name, rollNumber: s.rollNumber }));
    if (snapshots.length === 0) return res.json({ success: true, data: null });

    const total = snapshots.length;
    const averages = {
      leetcode: Math.round(snapshots.reduce((acc, s) => acc + s.leetcodeTotalSolved, 0) / total),
      hackerrank: Math.round(snapshots.reduce((acc, s) => acc + s.hackerrankTotalSolved, 0) / total),
      combinedScore: parseFloat((snapshots.reduce((acc, s) => acc + s.combinedScore, 0) / total).toFixed(2)),
    };

    const skillGaps = { lcOnly: 0, hrOnly: 0, easyPlateau: 0, balanced: 0 };
    snapshots.forEach(s => {
      if (s.leetcodeTotalSolved > 20 && s.hackerrankTotalSolved < 5) skillGaps.lcOnly++;
      else if (s.hackerrankTotalSolved > 20 && s.leetcodeTotalSolved < 5) skillGaps.hrOnly++;
      if (s.leetcodeTotalSolved > 10 && (s.leetcodeEasySolved / s.leetcodeTotalSolved > 0.8)) skillGaps.easyPlateau++;
      if (s.leetcodeTotalSolved > 10 && s.hackerrankTotalSolved > 10) skillGaps.balanced++;
    });

    const eliteGroup = snapshots.filter(s => s.leetcodeHardSolved > 50);
    const jobReady = snapshots.filter(s => s.combinedScore > 75);

    res.json({
      success: true,
      data: {
        averages,
        skillGaps,
        eliteCount: eliteGroup.length,
        jobReadyCount: jobReady.length,
        totals: {
          leetcode: snapshots.reduce((acc, s) => acc + s.leetcodeTotalSolved, 0),
          hackerrank: snapshots.reduce((acc, s) => acc + s.hackerrankTotalSolved, 0),
          easy: snapshots.reduce((acc, s) => acc + s.leetcodeEasySolved, 0),
          medium: snapshots.reduce((acc, s) => acc + s.leetcodeMediumSolved, 0),
          hard: snapshots.reduce((acc, s) => acc + s.leetcodeHardSolved, 0),
        },
        topPerformers: {
          byScore: [...snapshots].sort((a, b) => b.combinedScore - a.combinedScore).slice(0, 5),
          byLeetcode: [...snapshots].sort((a, b) => b.leetcodeTotalSolved - a.leetcodeTotalSolved).slice(0, 5),
          byHackerRank: [...snapshots].sort((a, b) => b.hackerrankTotalSolved - a.hackerrankTotalSolved).slice(0, 5),
          byImprovement: students.filter(s => s.snapshots.length >= 2).map(s => {
            const current = s.snapshots[0].combinedScore;
            const prev = s.snapshots[1].combinedScore;
            return {
              id: s.id,
              name: s.name,
              rollNumber: s.rollNumber,
              improvement: parseFloat((current - prev).toFixed(2))
            };
          }).sort((a, b) => b.improvement - a.improvement).slice(0, 5)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/trends - Faculty: Get class-wide topic trends
 */
export const getClassTrends = async (req, res, next) => {
  try {
    const snapshots = await prisma.performanceSnapshot.findMany({
      distinct: ['studentId'],
      orderBy: { fetchedAt: 'desc' },
    });

    const topicStats = {};
    snapshots.forEach(s => {
      try {
        const topics = s.topTopics ? JSON.parse(s.topTopics) : [];
        topics.forEach(t => {
          if (!topicStats[t.name]) topicStats[t.name] = { solved: 0, students: 0 };
          topicStats[t.name].solved += t.solved;
          topicStats[t.name].students += 1;
        });
      } catch (e) { /* ignore */ }
    });

    res.json({ success: true, data: topicStats });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/interventions - Faculty: Get students with 3+ weekly declines
 */
export const getInterventionList = async (req, res, next) => {
  try {
    const students = await prisma.student.findMany({
      where: { isActive: true },
      include: { snapshots: { orderBy: { fetchedAt: 'desc' }, take: 4 } },
    });

    const atRisk = students.filter(s => {
      if (s.snapshots.length < 3) return false;
      const scores = s.snapshots.map(sn => sn.combinedScore);
      // Check if scores are strictly decreasing: current < prev < prevPrev
      return scores[0] < scores[1] && scores[1] < scores[2];
    }).map(s => ({
      id: s.id,
      name: s.name,
      rollNumber: s.rollNumber,
      declineRate: (s.snapshots[2].combinedScore - s.snapshots[0].combinedScore).toFixed(2),
      currentScore: s.snapshots[0].combinedScore
    }));

    res.json({ success: true, data: atRisk });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/health - Admin: Get scraper health and latency
 */
export const getSystemHealth = async (req, res, next) => {
  try {
    const recentLogs = await prisma.fetchLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const stats = {
      leetcode: { success: 0, total: 0, avgLatency: 0, latencies: [] },
      hackerrank: { success: 0, total: 0, avgLatency: 0, latencies: [] },
    };

    recentLogs.forEach(log => {
      const p = log.platform.toLowerCase();
      if (stats[p]) {
        stats[p].total++;
        if (log.status === 'SUCCESS' || log.status === 'SKIPPED') {
          stats[p].success++;
          if (log.duration) stats[p].latencies.push(log.duration);
        }
      }
    });

    // Calculate final averages
    Object.keys(stats).forEach(p => {
      const sum = stats[p].latencies.reduce((a, b) => a + b, 0);
      stats[p].avgLatency = stats[p].latencies.length > 0 
        ? Math.round(sum / stats[p].latencies.length) 
        : 0;
      delete stats[p].latencies; // Clean up temp array
    });

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export const getSettings = async (req, res, next) => {
  try {
    const settings = await prisma.appSettings.findMany();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/settings/:key - Admin: update specific setting
 */
export const updateSettings = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const setting = await prisma.appSettings.update({
      where: { key },
      data: { value: value.toString() },
    });

    res.json({ success: true, data: setting });
  } catch (error) {
    next(error);
  }
};

