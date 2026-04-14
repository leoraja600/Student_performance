import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import fileUpload from 'express-fileupload';
import path from 'path';
import { fileURLToPath } from 'url';

import { config } from './utils/config.js';
import { logger } from './utils/logger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import hackathonRoutes from './routes/hackathonRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ===========================
// Security Middleware
// ===========================
app.use(helmet());

app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ===========================
// Body Parsing
// ===========================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// File upload middleware
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  abortOnLimit: true,
  createParentPath: true,
}));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ===========================
// Request Logging
// ===========================
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.url}`);
  next();
});

// ===========================
// Swagger API Documentation
// ===========================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Student Performance Analyzer API',
      version: '1.0.0',
      description: 'API for tracking and analyzing student performance on LeetCode and HackerRank',
    },
    servers: [{ url: `http://localhost:${config.port}` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

// const swaggerSpec = swaggerJsdoc(swaggerOptions);
// app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// ===========================
// Health Check
// ===========================
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
  });
});

// ===========================
// API Routes
// ===========================
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api', leaderboardRoutes);
app.use('/api/hackathons', hackathonRoutes);

// ===========================
// Error Handling
// ===========================
app.use(notFound);
app.use(errorHandler);

export default app;
