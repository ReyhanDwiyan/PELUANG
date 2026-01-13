require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');

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

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/markers', require('./routes/markerRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/spatial-data', require('./routes/spatialDataRoutes'));
app.use('/api/demographic', require('./routes/demographicRoutes'));
app.use('/api/economic', require('./routes/economicRoutes'));
app.use('/api/infrastructure', require('./routes/infrastructureRoutes'));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Server Running',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Error Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// --- PERBAIKAN LOGIC STARTUP ---
if (process.env.NODE_ENV !== 'production') {
  // Tunggu DB connect DULU, baru listen
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