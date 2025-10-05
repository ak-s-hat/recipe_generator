const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  ingredients: [{
    type: String
  }],
  instructions: [{
    type: String
  }],
  allergies: {
    type: String
  },
  budget: {
    type: String
  },
  leftovers: {
    type: String
  },
  preferences: {
    type: String
  },
  metadata: {
    prepTime: String,
    cookTime: String,
    servings: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Recipe', RecipeSchema);