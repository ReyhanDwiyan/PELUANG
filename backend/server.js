require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'user-id']
}));

// Middleware
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- ROUTES (HANYA YANG DIPAKAI) ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/markers', require('./routes/markerRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/spatial-data', require('./routes/spatialDataRoutes'));

// --- ROUTES LAMA YANG DIHAPUS (PENYEBAB ERROR) ---
// app.use('/api/demographic', ...);  <- SUDAH DIHAPUS
// app.use('/api/economic', ...);     <- SUDAH DIHAPUS
// app.use('/api/infrastructure', ...); <- SUDAH DIHAPUS

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Server Running',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Error Handler (Pastikan file ini ada di folder middleware)
app.use(require('./middleware/errorHandler'));

// --- LOGIC STARTUP ---
if (process.env.NODE_ENV !== 'production') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }).catch(err => {
    console.error('Gagal connect database, server batal jalan:', err);
    process.exit(1);
  });
}

module.exports = app;