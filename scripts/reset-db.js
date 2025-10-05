const mongoose = require('mongoose');
require('dotenv').config();

// Import models
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
    // Drop existing collections
    await User.collection.drop();
    console.log('Dropped users collection');
    
    await Recipe.collection.drop();
    console.log('Dropped recipes collection');
    
    await Chat.collection.drop();
    console.log('Dropped chats collection');
    
    console.log('All collections dropped successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error dropping collections:', error);
    process.exit(1);
  }
});