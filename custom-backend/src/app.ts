import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import fileRoutes from './routes/fileRoutes';

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: config.security.corsOrigin,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  keyGenerator: (req) => {
    // In test environment, allow explicit test isolation via header, otherwise use standard IP
    if (process.env.NODE_ENV === 'test') {
      return req.headers['x-test-ip'] ? (req.headers['x-test-ip'] as string) : `test-${Math.random()}`;
    }
    return req.ip || 'unknown';
  }
});
app.use(limiter);

// Parsing Middleware
app.use(express.json({ limit: '10kb' })); // Prevent large JSON payloads
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Routes
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/me', userRoutes);
app.use('/api/files', fileRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error Handling
app.use(errorHandler);

export default app;
