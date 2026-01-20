require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Connection dengan Cache untuk Serverless
let cachedDb = null;

const connectDB = async () => {
  if (cachedDb) {
    console.log('✅ Using cached MongoDB connection');
    return cachedDb;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    
    cachedDb = connection;
    console.log('✅ MongoDB Connected (New Connection)');
    return connection;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    throw error;
  }
};

// Connect to DB on startup
connectDB();

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

// Uploads directory - Hanya untuk development (Vercel serverless adalah read-only)
if (process.env.NODE_ENV !== 'production') {
  const uploadDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  // Serve static files dari uploads directory (hanya dev)
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

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
    message: 'Peluang API is running',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ 
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message 
  });
});

// Export untuk Vercel (PENTING!)
module.exports = app;

// Local Development Server
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}