/**
 * server.js
 * Entry point utama aplikasi Express.js Backend SMAN 1 Nagreg.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const appConfig = require('./src/config/appConfig');
const { testConnection } = require('./src/config/database');
const routes = require('./src/routes');
const { notFoundHandler, globalErrorHandler } = require('./src/middlewares/errorMiddleware');

const app = express();

// 1. Security & Protection Middlewares
app.use(helmet());

// 2. CORS Configuration
const allowedOrigins = [
  appConfig.clientUrl,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Izinkan request tanpa origin (seperti curl, mobile app, Postman) atau origin terdaftar
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Akses diblokir oleh kebijakan CORS SMAN 1 Nagreg.'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Rate Limiting (Kapasitas tinggi agar tidak mengganggu aktivitas sekolah di jaringan bersama/NAT)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Jendela waktu 15 menit
  max: 5000, // Sangat fleksibel (5000 request per 15 menit per IP)
  skip: () => appConfig.nodeEnv === 'development', // Tetap dinonaktifkan di mode development
  message: {
    success: false,
    message: 'Terlalu banyak permintaan dari IP ini. Silakan coba lagi setelah beberapa saat.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// 4. Request Body Parsers & Logger
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (appConfig.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 5. Root Welcome Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Selamat datang di RESTful API Sistem Presensi SMAN 1 Nagreg.',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// 6. Mount All API Routes
app.use('/api', routes);

// 7. Error Handling Middlewares
app.use(notFoundHandler);
app.use(globalErrorHandler);

// 8. Start Server & Test MySQL Connection
const server = app.listen(appConfig.port, async () => {
  console.log('====================================================');
  console.log(`🚀 SMAN 1 Nagreg Backend Server berjalan di Port ${appConfig.port}`);
  console.log(`🌐 Mode Lingkungan: ${appConfig.nodeEnv}`);
  console.log(`🔗 API Base URL: http://localhost:${appConfig.port}/api`);
  console.log('====================================================');

  // Test koneksi database saat startup
  await testConnection();
});

module.exports = { app, server };
