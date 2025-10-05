// App Configuration
const API_BASE = '/api';

// DOM Elements
const recipeForm = document.getElementById('recipeForm');
const resultsSection = document.getElementById('resultsSection');
const loadingSpinner = document.getElementById('loadingSpinner');
const agentStatusSection = document.getElementById('agentStatusSection');
const loginPrompt = document.getElementById('loginPrompt');
const inputSection = document.getElementById('inputSection');
const userMenu = document.getElementById('userMenu');
const authMenu = document.getElementById('authMenu');
const userName = document.getElementById('userName');

// Result Cards
const recipeCard = document.getElementById('recipeCard');
const mealPlanCard = document.getElementById('mealPlanCard');
const allergyCard = document.getElementById('allergyCard');
const budgetCard = document.getElementById('budgetCard');
const leftoverCard = document.getElementById('leftoverCard');
const groceryCard = document.getElementById('groceryCard');
const errorCard = document.getElementById('errorCard');

// Content Containers
const recipeContent = document.getElementById('recipeContent');
const mealPlanContent = document.getElementById('mealPlanContent');
const allergyContent = document.getElementById('allergyContent');
const budgetContent = document.getElementById('budgetContent');
const leftoverContent = document.getElementById('leftoverContent');
const groceryContent = document.getElementById('groceryContent');
const errorContent = document.getElementById('errorContent');

// App State
let currentRequest = null;
let currentUser = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    initializeEventListeners();
    checkAPIHealth();
    
    // Add click event to userName to redirect to dashboard
    if (userName) {
        userName.addEventListener('click', () => {
            window.location.href = '/dashboard';
        });
        userName.style.cursor = 'pointer';
    }
});

// Check authentication status
async function checkAuthStatus() {
    try {
        // Make an API call to check auth status with the backend
        const response = await fetch('/api/profile');
        
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.user) {
                currentUser = result.user;
                showAuthenticatedView();
            } else {
                showGuestView();
            }
        } else {
            showGuestView();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        showGuestView();
    }
}

// Show authenticated view
function showAuthenticatedView() {
    loginPrompt.style.display = 'none';
    inputSection.style.display = 'block';
    userMenu.style.display = 'flex';
    authMenu.style.display = 'none';
    // Use the actual user's display name from the backend
    userName.textContent = currentUser?.displayName || 'User';
}

// Show guest view
function showGuestView() {
    loginPrompt.style.display = 'block';
    inputSection.style.display = 'none';
    userMenu.style.display = 'none';
    authMenu.style.display = 'block';
}

// Event Listeners
function initializeEventListeners() {
    // Form submission
    if (recipeForm) {
        recipeForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Button actions
    document.querySelectorAll('.btn[data-action]').forEach(button => {
        button.addEventListener('click', handleButtonClick);
    });
    
    // Form validation
    const ingredientsInput = document.getElementById('ingredients');
    if (ingredientsInput) {
        ingredientsInput.addEventListener('input', validateForm);
    }
    
    // Save recipe button
    const saveRecipeBtn = document.getElementById('saveRecipe');
    if (saveRecipeBtn) {
        saveRecipeBtn.addEventListener('click', saveRecipe);
    }
}

// Handle form submission and button clicks
async function handleFormSubmit(e) {
    e.preventDefault();
    const actionButton = e.submitter;
    const action = actionButton?.dataset.action || 'recipe';
    await executeAction(action);
}

async function handleButtonClick(e) {
    if (e.target.type === 'submit') return; // Let form handler deal with submit buttons
    
    e.preventDefault();
    const action = e.target.dataset.action;
    await executeAction(action);
}

// Execute different actions based on button clicked
async function executeAction(action) {
    const formData = getFormData();
    
    if (!validateInput(formData)) {
        showError('Please provide at least some ingredients to get started!');
        return;
    }

    showLoading(true);
    hideAllCards();

    try {
        switch (action) {
            case 'recipe':
                await generateRecipe(formData);
                break;
            case 'mealPlan':
                await generateMealPlan(formData);
                break;
            case 'orchestrate':
                await orchestrateAgents(formData);
                break;
            default:
                await generateRecipe(formData);
        }
    } catch (error) {
        console.error('Action execution error:', error);
        showError(`Failed to ${action}: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

// Get form data
function getFormData() {
    return {
        ingredients: document.getElementById('ingredients')?.value.trim(),
        allergies: document.getElementById('allergies')?.value.trim(),
        budget: document.getElementById('budget')?.value.trim(),
        leftovers: document.getElementById('leftovers')?.value.trim(),
        preferences: document.getElementById('preferences')?.value.trim()
    };
}

// Validate input
function validateInput(data) {
    return data.ingredients && data.ingredients.length > 0;
}

// Validate form
function validateForm() {
    const ingredients = document.getElementById('ingredients')?.value.trim();
    const submitButtons = document.querySelectorAll('.btn[type="submit"], .btn[data-action]');
    
    submitButtons.forEach(button => {
        button.disabled = !ingredients;
    });
}

// API Functions
async function generateRecipe(data) {
    try {
        const response = await fetch(`${API_BASE}/recipes/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to generate recipe');
        }

        displayRecipe(result.data);
        
    } catch (error) {
        console.error('Recipe generation error:', error);
        showError(`Recipe generation failed: ${error.message}`);
    }
}

async function generateMealPlan(data) {
    try {
        const response = await fetch(`${API_BASE}/recipes/meal-plan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to generate meal plan');
        }

        displayMealPlan(result.mealPlan);
        
    } catch (error) {
        console.error('Meal plan generation error:', error);
        showError(`Meal plan generation failed: ${error.message}`);
    }
}

async function orchestrateAgents(data) {
    try {
        showAgentStatus(true);
        updateAgentStatuses('pending');

        const response = await fetch(`${API_BASE}/agents/orchestrate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to orchestrate agents');
        }

        updateAgentStatuses('success');
        displayAgentResults(result.data);
        
    } catch (error) {
        console.error('Agent orchestration error:', error);
        updateAgentStatuses('error');
        showError(`Agent orchestration failed: ${error.message}`);
    }
}

// Save recipe functionality
async function saveRecipe() {
    // In a real implementation, this would save the recipe to the user's account
    alert('Recipe saved to your account!');
}

// Display Functions
function displayRecipe(recipeData) {
    let content = '';
    
    if (typeof recipeData === 'string') {
        content = `<div class="recipe-content">${formatRecipeText(recipeData)}</div>`;
    } else if (recipeData.recipe) {
        content = formatStructuredRecipe(recipeData.recipe);
    } else {
        content = `<div class="recipe-content">${formatRecipeText(JSON.stringify(recipeData, null, 2))}</div>`;
    }
    
    recipeContent.innerHTML = content;
    showCard(recipeCard);
}

function displayMealPlan(mealPlanData) {
    let content = '';
    
    if (typeof mealPlanData === 'string') {
        content = `<div class="meal-plan-content">${formatMealPlanText(mealPlanData)}</div>`;
    } else {
        content = `<div class="meal-plan-content">${JSON.stringify(mealPlanData, null, 2)}</div>`;
    }
    
    mealPlanContent.innerHTML = content;
    showCard(mealPlanCard);
}

function displayAgentResults(data) {
    // Display individual agent results
    if (data.mealPlan) {
        displayMealPlan(data.mealPlan);
    }
    
    if (data.allergyWarnings) {
        // Format allergy warnings for better display
        let content = '';
        if (typeof data.allergyWarnings === 'string') {
            content = formatAllergyWarnings(data.allergyWarnings);
        } else {
            content = `<div class="allergy-content">${formatRecipeText(JSON.stringify(data.allergyWarnings, null, 2))}</div>`;
        }
        allergyContent.innerHTML = content;
        showCard(allergyCard);
    }
    
    if (data.budgetOptimization) {
        // Format budget optimization for better display
        let content = '';
        if (typeof data.budgetOptimization === 'string') {
            content = formatBudgetInfo(data.budgetOptimization);
        } else {
            content = `<div class="budget-content">${formatRecipeText(JSON.stringify(data.budgetOptimization, null, 2))}</div>`;
        }
        budgetContent.innerHTML = content;
        showCard(budgetCard);
    }
    
    if (data.leftoverSuggestions) {
        // Format leftover suggestions for better display
        let content = '';
        if (typeof data.leftoverSuggestions === 'string') {
            content = formatLeftoverSuggestions(data.leftoverSuggestions);
        } else {
            content = `<div class="leftover-content">${formatRecipeText(JSON.stringify(data.leftoverSuggestions, null, 2))}</div>`;
        }
        leftoverContent.innerHTML = content;
        showCard(leftoverCard);
    }
    
    if (data.groceryList) {
        // Format grocery list for better display
        let content = '';
        if (typeof data.groceryList === 'string') {
            content = formatGroceryList(data.groceryList);
        } else {
            content = `<div class="grocery-content">${formatRecipeText(JSON.stringify(data.groceryList, null, 2))}</div>`;
        }
        groceryContent.innerHTML = content;
        showCard(groceryCard);
    }
    
    // Show errors if any
    if (data.errors && data.errors.length > 0) {
        const errorMessages = data.errors.map(error => `<li>${error}</li>`).join('');
        errorContent.innerHTML = `
            <div class="error-content">
                <p><strong>Some agents encountered issues:</strong></p>
                <ul>${errorMessages}</ul>
            </div>
        `;
        showCard(errorCard);
    }
}

// Formatting Functions
function formatRecipeText(text) {
    // Basic text formatting for recipe content
    let formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
    
    return `<p>${formatted}</p>`;
}

function formatStructuredRecipe(recipe) {
    let html = `<div class="recipe-content">`;
    
    if (recipe.name) {
        html += `<h4>${recipe.name}</h4>`;
    }
    
    if (recipe.description) {
        html += `<p>${recipe.description}</p>`;
    }
    
    if (recipe.ingredients && recipe.ingredients.length > 0) {
        html += `<div class="ingredient-list">
            <h5><i class="fas fa-list"></i> Ingredients:</h5>
            <ul>`;
        recipe.ingredients.forEach(ingredient => {
            html += `<li>${ingredient}</li>`;
        });
        html += `</ul></div>`;
    }
    
    if (recipe.instructions && recipe.instructions.length > 0) {
        html += `<h5><i class="fas fa-clipboard-list"></i> Instructions:</h5>`;
        recipe.instructions.forEach((instruction, index) => {
            html += `<div class="instruction-step">
                <strong>Step ${index + 1}:</strong> ${instruction}
            </div>`;
        });
    }
    
    if (recipe.metadata) {
        html += `<div class="nutrition-info">
            ${recipe.metadata.prepTime ? `<div class="nutrition-item"><strong>Prep Time</strong><span>${recipe.metadata.prepTime}</span></div>` : ''}
            ${recipe.metadata.cookTime ? `<div class="nutrition-item"><strong>Cook Time</strong><span>${recipe.metadata.cookTime}</span></div>` : ''}
            ${recipe.metadata.servings ? `<div class="nutrition-item"><strong>Servings</strong><span>${recipe.metadata.servings}</span></div>` : ''}
        </div>`;
    }
    
    html += `</div>`;
    return html;
}

function formatMealPlanText(text) {
    // Handle 7-day meal planner output
    if (typeof text === 'string') {
        // Try to parse as JSON first
        try {
            const jsonData = JSON.parse(text);
            // If it's a JSON object, format it properly
            return formatStructuredMealPlan(jsonData);
        } catch (e) {
            // Not JSON, continue with text formatting
        }
        
        // Check if it's a structured meal plan
        if (text.includes('Day 1') || text.includes('Monday') || text.includes('Breakfast') || text.includes('Lunch') || text.includes('Dinner')) {
            // Format structured meal plan
            let formatted = text
                .replace(/Day \d+:/g, '<h4>$&</h4>')
                .replace(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):/g, '<h4>$&</h4>')
                .replace(/(Breakfast|Lunch|Dinner|Snack):/g, '<h5><strong>$&</strong></h5>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n\n/g, '</div><div class="meal-section">')
                .replace(/\n/g, '<br>');
            
            return `<div class="meal-plan-content"><div class="meal-section">${formatted}</div></div>`;
        } else {
            // Format as regular text
            return formatRecipeText(text);
        }
    } else if (typeof text === 'object') {
        // If it's already an object, format it properly
        return formatStructuredMealPlan(text);
    }
    return formatRecipeText(JSON.stringify(text, null, 2));
}

function formatStructuredMealPlan(mealPlan) {
    // Handle case where mealPlan is already a string
    if (typeof mealPlan === 'string') {
        try {
            mealPlan = JSON.parse(mealPlan);
        } catch (e) {
            // If parsing fails, treat as plain text
            return formatRecipeText(mealPlan);
        }
    }
    
    // Handle case where mealPlan is not an object
    if (typeof mealPlan !== 'object' || mealPlan === null) {
        return formatRecipeText(JSON.stringify(mealPlan, null, 2));
    }
    
    let html = '<div class="meal-plan-content">';
    
    // Handle different meal plan structures
    if (mealPlan.days) {
        // Format by days
        mealPlan.days.forEach((day, index) => {
            html += `<div class="meal-section">`;
            html += `<h4>Day ${index + 1}${day.name ? `: ${day.name}` : ''}</h4>`;
            
            if (day.meals) {
                Object.keys(day.meals).forEach(mealType => {
                    html += `<h5><strong>${mealType.charAt(0).toUpperCase() + mealType.slice(1)}:</strong></h5>`;
                    if (typeof day.meals[mealType] === 'string') {
                        html += `<p>${day.meals[mealType]}</p>`;
                    } else {
                        html += `<p>${JSON.stringify(day.meals[mealType], null, 2)}</p>`;
                    }
                });
            }
            html += `</div>`;
        });
    } else if (mealPlan.mealPlan) {
        // Format meal plan object
        const plan = mealPlan.mealPlan;
        if (typeof plan === 'object' && plan !== null) {
            Object.keys(plan).forEach(day => {
                html += `<div class="meal-section">`;
                html += `<h4>${day}</h4>`;
                
                const meals = plan[day];
                if (typeof meals === 'object' && meals !== null) {
                    Object.keys(meals).forEach(mealType => {
                        html += `<h5><strong>${mealType.charAt(0).toUpperCase() + mealType.slice(1)}:</strong></h5>`;
                        if (typeof meals[mealType] === 'string') {
                            html += `<p>${meals[mealType]}</p>`;
                        } else {
                            html += `<p>${JSON.stringify(meals[mealType], null, 2)}</p>`;
                        }
                    });
                }
                html += `</div>`;
            });
        }
    } else if (Array.isArray(mealPlan)) {
        // Handle array format
        mealPlan.forEach((day, index) => {
            html += `<div class="meal-section">`;
            html += `<h4>Day ${index + 1}${day.name ? `: ${day.name}` : ''}</h4>`;
            
            if (typeof day === 'object' && day !== null) {
                Object.keys(day).forEach(key => {
                    if (key !== 'name') {
                        html += `<h5><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong></h5>`;
                        if (typeof day[key] === 'string') {
                            html += `<p>${day[key]}</p>`;
                        } else {
                            html += `<p>${JSON.stringify(day[key], null, 2)}</p>`;
                        }
                    }
                });
            }
            html += `</div>`;
        });
    } else {
        // Generic formatting for unknown structure
        html += formatRecipeText(JSON.stringify(mealPlan, null, 2));
    }
    
    html += '</div>';
    return html;
}

function formatAllergyWarnings(warnings) {
    if (typeof warnings === 'string') {
        // Check if it contains structured allergy information
        if (warnings.includes('Allergen') || warnings.includes('Warning') || warnings.includes('Substitution')) {
            // Format structured allergy warnings
            let formatted = warnings
                .replace(/Allergen:/g, '<h5><i class="fas fa-exclamation-triangle"></i> Allergen:</h5>')
                .replace(/Warning:/g, '<h5><i class="fas fa-exclamation-circle"></i> Warning:</h5>')
                .replace(/Substitution:/g, '<h5><i class="fas fa-exchange-alt"></i> Substitution:</h5>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>');
            
            return `<div class="warning-content"><p>${formatted}</p></div>`;
        } else {
            // Format as regular text
            return `<div class="warning-content">${formatRecipeText(warnings)}</div>`;
        }
    }
    return `<div class="warning-content">${formatRecipeText(JSON.stringify(warnings, null, 2))}</div>`;
}

function formatBudgetInfo(budget) {
    if (typeof budget === 'string') {
        // Check if it contains structured budget information
        if (budget.includes('Cost') || budget.includes('Budget') || budget.includes('Alternative') || budget.includes('₹') || budget.includes('$')) {
            // Format structured budget information
            let formatted = budget
                .replace(/Cost:/g, '<h5><i class="fas fa-rupee-sign"></i> Cost:</h5>')
                .replace(/Budget:/g, '<h5><i class="fas fa-wallet"></i> Budget:</h5>')
                .replace(/Alternative:/g, '<h5><i class="fas fa-exchange-alt"></i> Alternative:</h5>')
                .replace(/Total:/g, '<h5><i class="fas fa-calculator"></i> Total:</h5>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>');
            
            return `<div class="budget-content"><p>${formatted}</p></div>`;
        } else {
            // Format as regular text
            return `<div class="budget-content">${formatRecipeText(budget)}</div>`;
        }
    }
    return `<div class="budget-content">${formatRecipeText(JSON.stringify(budget, null, 2))}</div>`;
}

function formatLeftoverSuggestions(suggestions) {
    if (typeof suggestions === 'string') {
        // Check if it contains structured leftover information
        if (suggestions.includes('Leftover') || suggestions.includes('Recipe') || suggestions.includes('Use')) {
            // Format structured leftover suggestions
            let formatted = suggestions
                .replace(/Leftover/g, '<h5><i class="fas fa-recycle"></i> Leftover</h5>')
                .replace(/Recipe:/g, '<h5><i class="fas fa-utensils"></i> Recipe:</h5>')
                .replace(/Use:/g, '<h5><i class="fas fa-lightbulb"></i> Use:</h5>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>');
            
            return `<div class="leftover-content"><p>${formatted}</p></div>`;
        } else {
            // Format as regular text
            return `<div class="leftover-content">${formatRecipeText(suggestions)}</div>`;
        }
    }
    return `<div class="leftover-content">${formatRecipeText(JSON.stringify(suggestions, null, 2))}</div>`;
}

function formatGroceryList(grocery) {
    // Handle grocery list output
    if (typeof grocery === 'string') {
        // Try to parse as JSON first
        try {
            const jsonData = JSON.parse(grocery);
            // If it's a JSON object, format it properly
            return formatStructuredGroceryList(jsonData);
        } catch (e) {
            // Not JSON, continue with text formatting
        }
        
        // Check if it contains structured grocery list information
        if (grocery.includes('Shopping') || grocery.includes('List') || grocery.includes('Item') || grocery.includes('Store') || grocery.includes('Price')) {
            // Format structured grocery list
            let formatted = grocery
                .replace(/Shopping List:/g, '<h4><i class="fas fa-shopping-cart"></i> Shopping List:</h4>')
                .replace(/Item:/g, '<h5><i class="fas fa-cart-plus"></i> Item:</h5>')
                .replace(/Store:/g, '<h5><i class="fas fa-store"></i> Store:</h5>')
                .replace(/Price:/g, '<h5><i class="fas fa-tag"></i> Price:</h5>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>');
            
            return `<div class="grocery-content"><p>${formatted}</p></div>`;
        } else {
            // Format as regular text
            return `<div class="grocery-content">${formatRecipeText(grocery)}</div>`;
        }
    } else if (typeof grocery === 'object') {
        // If it's already an object, format it properly
        return formatStructuredGroceryList(grocery);
    }
    return `<div class="grocery-content">${formatRecipeText(JSON.stringify(grocery, null, 2))}</div>`;
}

function formatStructuredGroceryList(groceryList) {
    // Handle case where groceryList is already a string
    if (typeof groceryList === 'string') {
        try {
            groceryList = JSON.parse(groceryList);
        } catch (e) {
            // If parsing fails, treat as plain text
            return formatRecipeText(groceryList);
        }
    }
    
    // Handle case where groceryList is not an object
    if (typeof groceryList !== 'object' || groceryList === null) {
        return formatRecipeText(JSON.stringify(groceryList, null, 2));
    }
    
    let html = '<div class="grocery-content">';
    html += '<h4><i class="fas fa-shopping-cart"></i> Shopping List</h4>';
    
    // Handle different grocery list structures
    if (Array.isArray(groceryList)) {
        // Format as array of items
        html += '<ul class="grocery-list">';
        groceryList.forEach(item => {
            if (typeof item === 'string') {
                html += `<li>${item}</li>`;
            } else if (typeof item === 'object' && item !== null) {
                html += '<li>';
                if (item.name) html += `<strong>${item.name}</strong>`;
                if (item.quantity) html += ` - Quantity: ${item.quantity}`;
                if (item.price) html += ` - Price: ${item.price}`;
                if (item.store) html += ` - Store: ${item.store}`;
                html += '</li>';
            }
        });
        html += '</ul>';
    } else if (groceryList.items && Array.isArray(groceryList.items)) {
        // Format as object with items property
        html += '<ul class="grocery-list">';
        groceryList.items.forEach(item => {
            html += '<li>';
            if (item.name) html += `<strong>${item.name}</strong>`;
            if (item.quantity) html += ` - Quantity: ${item.quantity}`;
            if (item.price) html += ` - Price: ${item.price}`;
            if (item.store) html += ` - Store: ${item.store}`;
            html += '</li>';
        });
        html += '</ul>';
    } else if (groceryList.list && Array.isArray(groceryList.list)) {
        // Format as object with list property
        html += '<ul class="grocery-list">';
        groceryList.list.forEach(item => {
            html += `<li>${item}</li>`;
        });
        html += '</ul>';
    } else if (typeof groceryList === 'object') {
        // Handle generic object
        html += '<ul class="grocery-list">';
        Object.keys(groceryList).forEach(key => {
            if (key !== 'list' && key !== 'items') {
                const item = groceryList[key];
                if (typeof item === 'string') {
                    html += `<li><strong>${key}:</strong> ${item}</li>`;
                } else if (typeof item === 'object' && item !== null) {
                    html += '<li>';
                    html += `<strong>${key}</strong>`;
                    if (item.name) html += ` - Name: ${item.name}`;
                    if (item.quantity) html += ` - Quantity: ${item.quantity}`;
                    if (item.price) html += ` - Price: ${item.price}`;
                    if (item.store) html += ` - Store: ${item.store}`;
                    html += '</li>';
                }
            }
        });
        html += '</ul>';
    } else {
        // Generic formatting for unknown structure
        html += formatRecipeText(JSON.stringify(groceryList, null, 2));
    }
    
    html += '</div>';
    return html;
}

// UI Helper Functions
function showLoading(show) {
    if (show) {
        resultsSection.style.display = 'block';
        loadingSpinner.style.display = 'block';
    } else {
        loadingSpinner.style.display = 'none';
    }
}

function showCard(card) {
    resultsSection.style.display = 'block';
    card.style.display = 'block';
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideAllCards() {
    const cards = [recipeCard, mealPlanCard, allergyCard, budgetCard, leftoverCard, groceryCard, errorCard];
    cards.forEach(card => {
        card.style.display = 'none';
    });
}

function showError(message) {
    errorContent.innerHTML = `<div class="error-content"><p>${message}</p></div>`;
    showCard(errorCard);
}

function showAgentStatus(show) {
    agentStatusSection.style.display = show ? 'block' : 'none';
}

function updateAgentStatuses(status) {
    const agents = ['meal-planner', 'allergy-checker', 'budget-optimizer', 'leftover-optimizer', 'grocery-suggester'];
    
    agents.forEach(agent => {
        const indicator = document.getElementById(`status-${agent}`);
        if (indicator) {
            indicator.className = `status-indicator ${status}`;
            
            switch (status) {
                case 'pending':
                    indicator.textContent = '⏳';
                    break;
                case 'running':
                    indicator.textContent = '🔄';
                    break;
                case 'success':
                    indicator.textContent = '✅';
                    break;
                case 'error':
                    indicator.textContent = '❌';
                    break;
            }
        }
    });
}

// Health Check
async function checkAPIHealth() {
    try {
        const response = await fetch('/health');
        const data = await response.json();
        console.log('API Health Check:', data);
    } catch (error) {
        console.warn('API health check failed:', error.message);
    }
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize form validation with debouncing
const ingredientsInput = document.getElementById('ingredients');
if (ingredientsInput) {
    const debouncedValidation = debounce(validateForm, 300);
    ingredientsInput.addEventListener('input', debouncedValidation);
}

// Export for debugging
window.RecipeApp = {
    generateRecipe,
    generateMealPlan,
    orchestrateAgents,
    getFormData,
    validateInput
};