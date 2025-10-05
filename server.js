const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
require('dotenv').config();

// Passport config
require('./config/passport')(passport);

const recipeRoutes = require('./routes/recipes');
const agentRoutes = require('./routes/agents');
const authRoutes = require('./routes/auth/auth');
const profileRoutes = require('./routes/auth/profile');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err));

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/recipes', recipeRoutes);
app.use('/api/agents', agentRoutes);
app.use('/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Authentication middleware
const ensureAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};

// Dashboard route (protected)
app.get('/dashboard', ensureAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Default route serves the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Agentic Recipe App Server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔧 API Health: http://localhost:${PORT}/health`);
  console.log(`🤖 GenAI Provider: ${process.env.GENAI_PROVIDER || 'cerebras'}`);
});

module.exports = app;