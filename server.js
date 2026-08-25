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
  ...appConfig.allowedOrigins,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Izinkan request tanpa origin (seperti curl, mobile app, Postman, Railway health checks)
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/+$/, '');

      // Izinkan jika ada di list allowedOrigins atau domain vercel.app / up.railway.app
      const isAllowed =
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(normalizedOrigin) ||
        normalizedOrigin.endsWith('.vercel.app') ||
        normalizedOrigin.endsWith('.up.railway.app');

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`[CORS Blocked] Origin: ${origin} tidak terdaftar di whitelist.`);
        callback(new Error(`Akses diblokir oleh kebijakan CORS SMAN 1 Nagreg: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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

// 8. Auto-init Database Check & Start Server
const initDatabase = require('./database/initDb');

const checkAndAutoInitDb = async () => {
  try {
    const [tables] = await pool.query("SHOW TABLES LIKE 'users'");
    if (tables.length === 0) {
      console.log('ℹ️ Database kosong terdeteksi. Memulai auto-inisialisasi tabel & data awal...');
      await initDatabase();
    } else {
      console.log('✅ Skema tabel database sudah siap dan aktif.');
    }
  } catch (err) {
    console.warn('⚠️ Pemeriksaan auto-init database dilewati:', err.message);
  }
};

const server = app.listen(appConfig.port, async () => {
  console.log('====================================================');
  console.log(`🚀 SMAN 1 Nagreg Backend Server berjalan di Port ${appConfig.port}`);
  console.log(`🌐 Mode Lingkungan: ${appConfig.nodeEnv}`);
  console.log(`🔗 API Base URL: http://localhost:${appConfig.port}/api`);
  console.log('====================================================');

  // Test koneksi database saat startup & auto-init jika database kosong
  const isConnected = await testConnection();
  if (isConnected) {
    await checkAndAutoInitDb();
  }
});

module.exports = { app, server };
