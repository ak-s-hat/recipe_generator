const express = require('express');
const router = express.Router();
const axios = require('axios');
const { ensureAuth } = require('../middleware/auth');
const Chat = require('../models/Chat');

// Apply authentication middleware to all routes
router.use(ensureAuth);

// Agent orchestration endpoint - connects to n8n workflow
router.post('/orchestrate', async (req, res) => {
  try {
    const {
      ingredients,
      allergies,
      budget,
      leftovers,
      preferences
    } = req.body;

    // Prepare data for n8n workflow
    const workflowData = {
      userInput: {
        ingredients,
        allergies,
        budget,
        leftovers,
        preferences
      },
      timestamp: new Date().toISOString(),
      requestId: generateRequestId()
    };

    // Call n8n webhook (when Docker/n8n is set up)
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    
    if (n8nWebhookUrl) {
      try {
        const n8nResponse = await axios.post(n8nWebhookUrl, workflowData, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        // Save chat to database
        const chat = new Chat({
          user: req.user.id,
          message: `Orchestrate agents with ingredients: ${ingredients}`,
          response: JSON.stringify(n8nResponse.data)
        });
        await chat.save();

        return res.json({
          success: true,
          data: n8nResponse.data,
          source: 'n8n_workflow',
          requestId: workflowData.requestId
        });
      } catch (n8nError) {
        console.warn('n8n workflow unavailable, falling back to direct agent calls:', n8nError.message);
      }
    }

    // Fallback: Direct agent orchestration
    const agentResults = await orchestrateAgentsDirectly(workflowData);

    // Save chat to database
    const chat = new Chat({
      user: req.user.id,
      message: `Orchestrate agents with ingredients: ${ingredients}`,
      response: JSON.stringify(agentResults)
    });
    await chat.save();

    res.json({
      success: true,
      data: agentResults,
      source: 'direct_orchestration',
      requestId: workflowData.requestId
    });

  } catch (error) {
    console.error('Agent orchestration error:', error);
    res.status(500).json({
      error: 'Agent Orchestration Failed',
      message: error.message
    });
  }
});

// Direct agent orchestration (when n8n is not available)
async function orchestrateAgentsDirectly(workflowData) {
  const results = {
    mealPlan: null,
    allergyWarnings: null,
    budgetOptimization: null,
    leftoverSuggestions: null,
    groceryList: null,
    errors: []
  };

  const genaiService = require('../services/genaiService');
  const { userInput } = workflowData;

  try {
    // 1. Meal Planner Agent
    const mealPlanPrompt = genaiService.formatPrompt('mealPlan', userInput);
    results.mealPlan = await genaiService.generateRecipe(mealPlanPrompt);
  } catch (error) {
    results.errors.push(`Meal Planner Agent: ${error.message}`);
  }

  try {
    // 2. Allergy Checker Agent
    if (userInput.allergies) {
      const allergyPrompt = `Analyze potential allergens in these ingredients: ${userInput.ingredients}. 
                            Known allergies: ${userInput.allergies}. 
                            Provide warnings and safe substitutions in JSON format.`;
      results.allergyWarnings = await genaiService.generateRecipe(allergyPrompt);
    }
  } catch (error) {
    results.errors.push(`Allergy Checker Agent: ${error.message}`);
  }

  try {
    // 3. Budget Recipe Agent
    if (userInput.budget) {
      const budgetPrompt = `Create budget-friendly recipes using: ${userInput.ingredients}. 
                           Budget limit: ${userInput.budget}. 
                           Provide cost estimates and cheaper alternatives in JSON format.`;
      results.budgetOptimization = await genaiService.generateRecipe(budgetPrompt);
    }
  } catch (error) {
    results.errors.push(`Budget Recipe Agent: ${error.message}`);
  }

  try {
    // 4. Leftover Optimizer Agent
    if (userInput.leftovers) {
      const leftoverPrompt = genaiService.formatPrompt('leftoverOptimize', userInput);
      results.leftoverSuggestions = await genaiService.generateRecipe(leftoverPrompt);
    }
  } catch (error) {
    results.errors.push(`Leftover Optimizer Agent: ${error.message}`);
  }

  try {
    // 5. Grocery Suggestion Agent
    const groceryPrompt = `Based on these ingredients needed: ${userInput.ingredients}, 
                          and considering budget: ${userInput.budget || 'flexible'}, 
                          create a shopping list with suggestions for online grocery platforms like Blinkit, Zepto, etc. 
                          Include estimated costs and store recommendations in JSON format.`;
    results.groceryList = await genaiService.generateRecipe(groceryPrompt);
  } catch (error) {
    results.errors.push(`Grocery Suggestion Agent: ${error.message}`);
  }

  return results;
}

// Individual agent endpoints for testing
router.post('/meal-planner', async (req, res) => {
  try {
    const genaiService = require('../services/genaiService');
    const prompt = genaiService.formatPrompt('mealPlan', req.body);
    const result = await genaiService.generateRecipe(prompt);
    
    res.json({
      success: true,
      agent: 'meal-planner',
      result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Meal Planner Agent Failed',
      message: error.message
    });
  }
});

router.post('/allergy-checker', async (req, res) => {
  try {
    const genaiService = require('../services/genaiService');
    const prompt = genaiService.formatPrompt('allergyCheck', req.body);
    const result = await genaiService.generateRecipe(prompt);
    
    res.json({
      success: true,
      agent: 'allergy-checker',
      result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Allergy Checker Agent Failed',
      message: error.message
    });
  }
});

router.post('/budget-optimizer', async (req, res) => {
  try {
    const genaiService = require('../services/genaiService');
    const prompt = genaiService.formatPrompt('budgetOptimize', req.body);
    const result = await genaiService.generateRecipe(prompt);
    
    res.json({
      success: true,
      agent: 'budget-optimizer',
      result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Budget Optimizer Agent Failed',
      message: error.message
    });
  }
});

router.post('/leftover-optimizer', async (req, res) => {
  try {
    const genaiService = require('../services/genaiService');
    const prompt = genaiService.formatPrompt('leftoverOptimize', req.body);
    const result = await genaiService.generateRecipe(prompt);
    
    res.json({
      success: true,
      agent: 'leftover-optimizer',
      result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Leftover Optimizer Agent Failed',
      message: error.message
    });
  }
});

router.post('/grocery-suggester', async (req, res) => {
  try {
    const genaiService = require('../services/genaiService');
    const { ingredients, budget } = req.body;
    
    const prompt = `Create a comprehensive shopping list for these ingredients: ${ingredients}. 
                   Budget constraint: ${budget || 'flexible'}. 
                   Include links or suggestions for online grocery platforms like Blinkit, Zepto, BigBasket. 
                   Provide cost estimates and store-specific availability. Format as JSON.`;
    
    const result = await genaiService.generateRecipe(prompt);
    
    res.json({
      success: true,
      agent: 'grocery-suggester',
      result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Grocery Suggester Agent Failed',
      message: error.message
    });
  }
});

// Helper function to generate unique request IDs
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = router;