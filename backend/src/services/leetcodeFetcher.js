import axios from 'axios';
import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';

const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';

const USER_STATS_QUERY = `
query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    submitStats {
      acSubmissionNum {
        difficulty
        count
      }
    }
    tagProblemCounts {
      advanced {
        tagName
        tagSlug
        problemsSolved
      }
      intermediate {
        tagName
        tagSlug
        problemsSolved
      }
      fundamental {
        tagName
        tagSlug
        problemsSolved
      }
    }
  }
  userContestRanking(username: $username) {
    attendedContestsCount
    rating
    globalRanking
  }
}
`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Verify a LeetCode username exists
 * @param {string} username
 * @returns {Promise<boolean>}
 */
export async function verifyLeetcodeUsername(username) {
  try {
    const response = await axios.post(
      LEETCODE_GRAPHQL_URL,
      {
        query: `query { matchedUser(username: "${username}") { username } }`,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Referer': 'https://leetcode.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      }
    );
    return !!response.data?.data?.matchedUser;
  } catch {
    return false;
  }
}

/**
 * Fetch LeetCode stats for a given username
 * @param {string} username
 * @returns {Promise<Object>}
 */
export async function fetchLeetcodeStats(username) {
  const startTime = Date.now();

  try {
    logger.info(`[LeetCode] Fetching stats for: ${username}`);

    const response = await axios.post(
      LEETCODE_GRAPHQL_URL,
      {
        query: USER_STATS_QUERY,
        variables: { username },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Referer': `https://leetcode.com/${username}/`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Origin': 'https://leetcode.com',
        },
        timeout: 15000,
      }
    );

    const data = response.data?.data;

    if (!data?.matchedUser) {
      throw new Error(`Username "${username}" not found on LeetCode`);
    }

    const submitStats = data.matchedUser.submitStats?.acSubmissionNum || [];
    const allCount = submitStats.find((s) => s.difficulty === 'All')?.count || 0;
    const easyCount = submitStats.find((s) => s.difficulty === 'Easy')?.count || 0;
    const mediumCount = submitStats.find((s) => s.difficulty === 'Medium')?.count || 0;
    const hardCount = submitStats.find((s) => s.difficulty === 'Hard')?.count || 0;

    const contestData = data.userContestRanking;
    
    // Process topics/tags
    const tags = data.matchedUser.tagProblemCounts || {};
    const topics = [
      ...(tags.advanced || []),
      ...(tags.intermediate || []),
      ...(tags.fundamental || []),
    ].map(t => ({ name: t.tagName, solved: t.problemsSolved }))
     .sort((a, b) => b.solved - a.solved)
     .slice(0, 10); // top 10 topics

    const duration = Date.now() - startTime;

    const result = {
      username,
      totalSolved: allCount,
      easySolved: easyCount,
      mediumSolved: mediumCount,
      hardSolved: hardCount,
      contestRating: contestData?.rating ? parseFloat(contestData.rating.toFixed(2)) : null,
      globalRank: contestData?.globalRanking || null,
      attendedContests: contestData?.attendedContestsCount || 0,
      topics,
      duration,
    };

    logger.info(`[LeetCode] Fetched ${username}: total=${allCount}, easy=${easyCount}, medium=${mediumCount}, hard=${hardCount}, rating=${result.contestRating}`);

    // Add delay to avoid rate limiting
    await sleep(config.scraping.lcRequestDelay);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const isRateLimit = error.response?.status === 429;
    const message = isRateLimit ? 'Rate limited by LeetCode' : error.message;

    if (isRateLimit) {
       logger.warn(`[LeetCode] 429 Forbidden for ${username}. Delaying 10s...`);
       await sleep(10000); // 10s base penalty
    }

    logger.error(`[LeetCode] Failed for ${username}: ${message}`);
    throw new Error(message);
  }
}
