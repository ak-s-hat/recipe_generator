const mongoose = require('mongoose');
require('dotenv').config();

// Import models to ensure indexes are created
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const Chat = require('../models/Chat');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Ensure indexes are created
    await User.init();
    console.log('User indexes created');
    
    await Recipe.init();
    console.log('Recipe indexes created');
    
    await Chat.init();
    console.log('Chat indexes created');
    
    console.log('Database initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
});