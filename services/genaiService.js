const axios = require('axios');

const FASTAPI_BASE_URL = 'http://localhost:8000'; // Update with your FastAPI URL

async function generateRecipe(data) {
    try {
        const response = await axios.post(`${FASTAPI_BASE_URL}/generate-recipe`, data);
        return response.data;
    } catch (error) {
        console.error('Error in genaiService.generateRecipe:', error.message);
        throw new Error('Failed to generate recipe');
    }
}

async function orchestrateAgents(data) {
    try {
        const response = await axios.post(`${FASTAPI_BASE_URL}/orchestrate-agents`, data);
        return response.data;
    } catch (error) {
        console.error('Error in genaiService.orchestrateAgents:', error.message);
        throw new Error('Failed to orchestrate agents');
    }
}

module.exports = {
    generateRecipe,
    orchestrateAgents,
};