import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';

// In-memory cache: { username -> { data, fetchedAt } }
const hackerrankCache = new Map();

/**
 * Verify a HackerRank username exists via REST API
 * @param {string} username
 * @returns {Promise<boolean>}
 */
export async function verifyHackerrankUsername(username) {
  try {
    const res = await fetch(`https://www.hackerrank.com/rest/hackers/${username}/profile`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

/**
 * Fetch HackerRank stats using the REST API
 * @param {string} username
 * @returns {Promise<Object>}
 */
export async function fetchHackerrankStats(username) {
  const startTime = Date.now();

  // Check cache
  const cached = hackerrankCache.get(username);
  if (cached) {
    const ageMinutes = (Date.now() - cached.fetchedAt) / 1000 / 60;
    if (ageMinutes < (config.scraping?.hrCacheTTL || 60)) {
      logger.info(`[HackerRank] Using cached data for ${username} (age: ${ageMinutes.toFixed(1)} min)`);
      return { ...cached.data, fromCache: true, duration: 0 };
    }
  }

  try {
    logger.info(`[HackerRank] Fetching REST stats for: ${username}`);

    const res = await fetch(`https://www.hackerrank.com/rest/hackers/${username}/badges`, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    if (res.status === 404) {
      throw new Error(`HackerRank profile "${username}" not found`);
    }

    if (!res.ok) {
        throw new Error(`Failed to fetch HackerRank data (Status: ${res.status})`);
    }

    const data = await res.json();
    const badges = data.models || [];

    // Sum up solved, score, and collect topics
    let totalSolved = 0;
    let score = 0;
    const topics = [];

    badges.forEach(badge => {
      totalSolved += (badge.solved || 0);
      score += (badge.current_points || 0);
      topics.push({ name: badge.badge_name, solved: badge.solved || 0 });
    });

    const duration = Date.now() - startTime;
    const result = {
      username,
      totalSolved,
      score: Math.round(score),
      topics,
      duration,
      fromCache: false,
    };

    // Store in cache
    hackerrankCache.set(username, { data: result, fetchedAt: Date.now() });

    logger.info(`[HackerRank] Fetched ${username}: solved=${totalSolved}, score=${score} (${badges.length} badges)`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`[HackerRank] Failed for ${username}: ${error.message}`);
    
    // Falling back to 0 if we can confirm it's not a complete network failure
    if (error.message.includes('not found')) {
        throw error;
    }
    
    return {
        username,
        totalSolved: 0,
        score: 0,
        duration,
        error: error.message
    };
  }
}

/**
 * Clear HackerRank cache for a specific user or all users
 */
export function clearHackerrankCache(username) {
  if (username) {
    hackerrankCache.delete(username);
    logger.info(`[HackerRank] Cache cleared for: ${username}`);
  } else {
    hackerrankCache.clear();
    logger.info('[HackerRank] Cache cleared for all users');
  }
}
