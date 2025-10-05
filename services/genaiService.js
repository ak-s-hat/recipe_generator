const axios = require('axios');

class GenAIService {
  constructor() {
    this.provider = process.env.GENAI_PROVIDER || 'cerebras';
    this.cerebrasApiKey = process.env.CEREBRAS_API_KEY;
    this.llamaApiKey = process.env.LLAMA_API_KEY;
    this.openaiApiKey = process.env.OPENAI_API_KEY;
  }

  async generateRecipe(prompt, options = {}) {
    try {
      let response;
      
      switch (this.provider) {
        case 'cerebras':
          response = await this.callCerebrasAPI(prompt, options);
          break;
        case 'llama':
          response = await this.callLlamaAPI(prompt, options);
          break;
        case 'openai':
          response = await this.callOpenAIAPI(prompt, options);
          break;
        default:
          throw new Error(`Unknown GenAI provider: ${this.provider}`);
      }

      return response;
    } catch (error) {
      console.error('GenAI API Error:', error.message);
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  async callCerebrasAPI(prompt, options) {
    // Cerebras API integration
    const endpoint = 'https://api.cerebras.ai/v1/chat/completions';
    
    const requestData = {
      model: 'llama3.1-8b',
      messages: [
        {
          role: 'system',
          content: 'You are a professional chef and nutritionist AI assistant. Provide detailed, accurate, and helpful recipe suggestions with clear instructions, ingredient lists, and nutritional information.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7,
      stream: false
    };

    try {
      const response = await axios.post(endpoint, requestData, {
        headers: {
          'Authorization': `Bearer ${this.cerebrasApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Invalid Cerebras API key. Please check your configuration.');
      }
      throw new Error(`Cerebras API error: ${error.message}`);
    }
  }

  async callLlamaAPI(prompt, options) {
    // Meta LLaMA API integration (placeholder - adjust based on actual API)
    const endpoint = 'https://api.llama-api.com/chat/completions';
    
    const requestData = {
      model: 'llama-2-70b-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a professional chef and nutritionist AI assistant. Provide detailed, accurate, and helpful recipe suggestions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7
    };

    try {
      const response = await axios.post(endpoint, requestData, {
        headers: {
          'Authorization': `Bearer ${this.llamaApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      throw new Error(`LLaMA API error: ${error.message}`);
    }
  }

  async callOpenAIAPI(prompt, options) {
    // OpenAI API as fallback
    const endpoint = 'https://api.openai.com/v1/chat/completions';
    
    const requestData = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a professional chef and nutritionist AI assistant. Provide detailed, accurate, and helpful recipe suggestions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7
    };

    try {
      const response = await axios.post(endpoint, requestData, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  // Helper method to format prompts for different use cases
  formatPrompt(type, data) {
    const prompts = {
      recipe: `Generate a detailed recipe using these ingredients: ${data.ingredients}. 
               Consider dietary restrictions: ${data.allergies || 'none'}. 
               Budget constraint: ${data.budget || 'no limit'}. 
               Available leftovers: ${data.leftovers || 'none'}.
               
               Please provide:
               1. Recipe name and description
               2. Complete ingredient list with quantities
               3. Step-by-step instructions
               4. Estimated preparation and cooking time
               5. Servings
               6. Nutritional information (approximate)
               7. Cost estimate if budget was provided
               
               Format the response in JSON with clear sections.`,
      
      mealPlan: `Create a 7-day meal plan with these constraints:
                 Ingredients available: ${data.ingredients}
                 Dietary restrictions: ${data.allergies || 'none'}
                 Budget: ${data.budget || 'flexible'}
                 Leftovers to use: ${data.leftovers || 'none'}
                 
                 Provide a day-by-day meal plan with breakfast, lunch, and dinner suggestions.
                 Include a consolidated shopping list.
                 Format as JSON.`,
      
      allergyCheck: `Analyze this recipe for potential allergens and provide substitutions:
                     Recipe: ${data.recipe}
                     Known allergies: ${data.allergies}
                     
                     Highlight any allergens found and suggest safe alternatives.
                     Format as JSON with warnings and substitutions.`,
      
      budgetOptimize: `Optimize this recipe for budget constraints:
                       Recipe: ${data.recipe}
                       Budget limit: ${data.budget}
                       
                       Suggest cost-effective alternatives and provide estimated total cost.
                       Format as JSON.`,
      
      leftoverOptimize: `Create new recipes using these leftovers:
                         Available leftovers: ${data.leftovers}
                         Additional ingredients available: ${data.ingredients || 'basic pantry items'}
                         
                         Suggest creative recipes that minimize waste.
                         Format as JSON.`
    };

    return prompts[type] || prompts.recipe;
  }
}

module.exports = new GenAIService();