import prisma from '../utils/prisma.js';
import { calculateCombinedScore } from '../services/dataSync.js';
import { logger } from '../utils/logger.js';

async function applyNewWeights() {
  try {
    const weights = {
      LEETCODE_WEIGHT: '40',
      HACKERRANK_WEIGHT: '25',
      HACKATHON_WEIGHT: '35'
    };

    console.log('Updating AppSettings in database...');
    for (const [key, value] of Object.entries(weights)) {
      await prisma.appSettings.upsert({
        where: { key },
        update: { value },
        create: { key, value, description: `Weight for ${key}` }
      });
    }

    const activeWeights = {
      leetcodeMax: 23510,
      leetcodeWeight: 40,
      hackerrankMax: 500,
      hackerrankWeight: 25,
      hackathonMax: 10,
      hackathonWeight: 35
    };

    console.log('Recalculating all snapshots...');
    const snapshots = await prisma.performanceSnapshot.findMany({
      include: {
        student: {
          include: {
            hackathons: { where: { status: 'VERIFIED' } }
          }
        }
      }
    });

    console.log(`Found ${snapshots.length} snapshots to update.`);
    
    // Position scores for hackathons
    const POSITION_SCORES = { WINNER: 10, RUNNER_UP: 7, TOP_5: 5, PARTICIPANT: 3 };

    for (const snap of snapshots) {
      const hackathonScoreTotal = snap.student.hackathons.reduce(
        (sum, h) => sum + (POSITION_SCORES[h.position] || 0), 0
      );

      const newScore = calculateCombinedScore(
        { 
          easy: snap.leetcodeEasySolved, 
          medium: snap.leetcodeMediumSolved, 
          hard: snap.leetcodeHardSolved 
        },
        snap.hackerrankTotalSolved,
        hackathonScoreTotal,
        activeWeights
      );

      await prisma.performanceSnapshot.update({
        where: { id: snap.id },
        data: { 
          combinedScore: newScore,
          hackathonScore: hackathonScoreTotal 
        }
      });
    }

    console.log('Recalculation complete!');
  } catch (error) {
    console.error('Failed to update weights:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applyNewWeights();
