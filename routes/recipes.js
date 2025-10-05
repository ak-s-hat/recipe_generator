const express = require('express');
const router = express.Router();
const genaiService = require('../services/genaiService');
const { ensureAuth } = require('../middleware/auth');
const Recipe = require('../models/Recipe');
const Chat = require('../models/Chat');

// Apply authentication middleware to all routes
router.use(ensureAuth);

// Main recipe generation endpoint
router.post('/generate', async (req, res) => {
  try {
    const {
      ingredients,
      allergies,
      budget,
      leftovers,
      preferences,
      requestType = 'recipe'
    } = req.body;

    // Validate required inputs
    if (!ingredients || ingredients.trim() === '') {
      return res.status(400).json({
        error: 'Ingredients are required',
        message: 'Please provide at least one ingredient'
      });
    }

    // Prepare data for prompt generation
    const promptData = {
      ingredients,
      allergies,
      budget,
      leftovers,
      preferences
    };

    // Generate the appropriate prompt based on request type
    const prompt = genaiService.formatPrompt(requestType, promptData);

    // Call GenAI service
    const response = await genaiService.generateRecipe(prompt, {
      maxTokens: 2500,
      temperature: 0.7
    });

    // Try to parse response as JSON, fallback to plain text
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response);
    } catch (e) {
      // If not valid JSON, structure the plain text response
      parsedResponse = {
        recipe: {
          name: 'Generated Recipe',
          content: response,
          ingredients: [],
          instructions: [],
          metadata: {
            prepTime: 'Not specified',
            cookTime: 'Not specified',
            servings: 'Not specified'
          }
        },
        raw: response
      };
    }

    // Save recipe to database
    const recipeData = {
      user: req.user.id,
      name: parsedResponse.recipe?.name || 'Generated Recipe',
      ingredients: parsedResponse.recipe?.ingredients || [],
      instructions: parsedResponse.recipe?.instructions || [],
      allergies: allergies || '',
      budget: budget || '',
      leftovers: leftovers || '',
      preferences: preferences || '',
      metadata: parsedResponse.recipe?.metadata || {}
    };

    const recipe = new Recipe(recipeData);
    await recipe.save();

    // Save chat to database
    const chat = new Chat({
      user: req.user.id,
      message: `Generate ${requestType} with ingredients: ${ingredients}`,
      response: response
    });
    await chat.save();

    // Return structured response
    res.json({
      success: true,
      data: parsedResponse,
      recipeId: recipe._id,
      requestInfo: {
        ingredients,
        allergies,
        budget,
        leftovers,
        requestType,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Recipe generation error:', error);
    res.status(500).json({
      error: 'Recipe Generation Failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
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