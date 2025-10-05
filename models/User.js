const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  recipes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe'
  }],
  chatHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);