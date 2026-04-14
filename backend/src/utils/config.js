import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@college.edu',
    password: process.env.ADMIN_PASSWORD || 'Admin@123456',
    name: process.env.ADMIN_NAME || 'System Admin',
  },

  scoring: {
    leetcodeMax: parseInt(process.env.LEETCODE_MAX_SCORE || '23510', 10),
    leetcodeWeight: parseInt(process.env.LEETCODE_WEIGHT || '40', 10),
    hackerrankMax: parseInt(process.env.HACKERRANK_MAX_SCORE || '500', 10),
    hackerrankWeight: parseInt(process.env.HACKERRANK_WEIGHT || '40', 10),
    hackathonMax: parseInt(process.env.HACKATHON_MAX_SCORE || '10', 10),
    hackathonWeight: parseInt(process.env.HACKATHON_WEIGHT || '20', 10),
  },

  scraping: {
    lcRequestDelay: parseInt(process.env.LC_REQUEST_DELAY || '1500', 10),
    hrCacheTTL: parseInt(process.env.HR_CACHE_TTL_MINUTES || '60', 10),
  },

  cron: {
    schedule: process.env.CRON_SCHEDULE || '0 */6 * * *',
    enabled: process.env.CRON_ENABLED !== 'false',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || 'logs',
  },
};
