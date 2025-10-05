const express = require('express');
const router = express.Router();
const genaiService = require('../services/genaiService');
const { ensureAuth } = require('../middleware/auth');
const Recipe = require('../models/Recipe');
const Chat = require('../models/Chat');
const axios = require('axios'); // Add axios for HTTP requests

const FASTAPI_BASE_URL = 'http://localhost:8000'; // Update with your FastAPI URL

// Apply authentication middleware to all routes
router.use(ensureAuth);

// Main recipe generation endpoint
router.post('/generate', async (req, res) => {
  try {
    const response = await axios.post(`${FASTAPI_BASE_URL}/generate-recipe`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error forwarding to FastAPI:', error.message);
    res.status(500).json({ message: 'Failed to generate recipe', error: error.message });
  }
});

// Endpoint for meal planning
router.post('/meal-plan', async (req, res) => {
  try {
    const { ingredients, allergies, budget, preferences } = req.body;

    const promptData = {
      ingredients,
      allergies,
      budget,
      preferences
    };

    const prompt = genaiService.formatPrompt('mealPlan', promptData);
    const response = await genaiService.generateRecipe(prompt);

    // Save chat to database
    const chat = new Chat({
      user: req.user.id,
      message: `Generate meal plan with ingredients: ${ingredients}`,
      response: response
    });
    await chat.save();

    res.json({
      success: true,
      mealPlan: response,
      requestInfo: {
        ingredients,
        allergies,
        budget,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Meal plan generation error:', error);
    res.status(500).json({
      error: 'Meal Plan Generation Failed',
      message: error.message
    });
  }
});

// Endpoint for allergy checking
router.post('/allergy-check', async (req, res) => {
  try {
    const { recipe, allergies } = req.body;

    if (!recipe || !allergies) {
      return res.status(400).json({
        error: 'Recipe and allergies are required'
      });
    }

    const promptData = { recipe, allergies };
    const prompt = genaiService.formatPrompt('allergyCheck', promptData);
    const response = await genaiService.generateRecipe(prompt);

    // Save chat to database
    const chat = new Chat({
      user: req.user.id,
      message: `Check allergies for recipe: ${recipe.substring(0, 50)}...`,
      response: response
    });
    await chat.save();

    res.json({
      success: true,
      allergyAnalysis: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Allergy check error:', error);
    res.status(500).json({
      error: 'Allergy Check Failed',
      message: error.message
    });
  }
});

// Endpoint for budget optimization
router.post('/budget-optimize', async (req, res) => {
  try {
    const { recipe, budget } = req.body;

    if (!recipe || !budget) {
      return res.status(400).json({
        error: 'Recipe and budget are required'
      });
    }

    const promptData = { recipe, budget };
    const prompt = genaiService.formatPrompt('budgetOptimize', promptData);
    const response = await genaiService.generateRecipe(prompt);

    // Save chat to database
    const chat = new Chat({
      user: req.user.id,
      message: `Optimize recipe for budget: ${budget}`,
      response: response
    });
    await chat.save();

    res.json({
      success: true,
      budgetOptimization: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Budget optimization error:', error);
    res.status(500).json({
      error: 'Budget Optimization Failed',
      message: error.message
    });
  }
});

// Endpoint for leftover optimization
router.post('/leftover-optimize', async (req, res) => {
  try {
    const { leftovers, ingredients } = req.body;

    if (!leftovers) {
      return res.status(400).json({
        error: 'Leftovers are required'
      });
    }

    const promptData = { leftovers, ingredients };
    const prompt = genaiService.formatPrompt('leftoverOptimize', promptData);
    const response = await genaiService.generateRecipe(prompt);

    // Save chat to database
    const chat = new Chat({
      user: req.user.id,
      message: `Optimize leftovers: ${leftovers}`,
      response: response
    });
    await chat.save();

    res.json({
      success: true,
      leftoverRecipes: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Leftover optimization error:', error);
    res.status(500).json({
      error: 'Leftover Optimization Failed',
      message: error.message
    });
  }
});

// Get a specific recipe by ID
router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: 'Recipe not found'
      });
    }
    
    res.json({
      success: true,
      recipe
    });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recipe',
      message: error.message
    });
  }
});

// Get user's recipe history
router.get('/history', async (req, res) => {
  try {
    const recipes = await Recipe.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      recipes
    });
  } catch (error) {
    console.error('Error fetching recipe history:', error);
    res.status(500).json({
      error: 'Failed to fetch recipe history',
      message: error.message
    });
  }
});

// Get user's chat history
router.get('/chat-history', async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.user.id }).sort({ timestamp: -1 });
    res.json({
      success: true,
      chats
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({
      error: 'Failed to fetch chat history',
      message: error.message
    });
  }
});

module.exports = router;