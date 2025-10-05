import os
import requests
from cerebras.cloud.sdk import Cerebras
from dotenv import load_dotenv

load_dotenv()

def get_prompt_template(request_type, data):
    ingredients = data.get("ingredients", "")
    allergies = data.get("allergies", "")
    budget = data.get("budget", "")
    leftovers = data.get("leftovers", "")
    preferences = data.get("preferences", "")
    if request_type == "recipe":
        return f"Generate a recipe with ingredients: {ingredients}. Preferences: {preferences} Allergies: {allergies}. Provide JSON with recipe_name, ingredients, instructions."
    elif request_type == "mealPlan":
        return f"Generate a 7-day meal plan considering: {ingredients}, Preferences: {preferences}, Allergies: {allergies}, Budget: {budget}. Return JSON with name, mealPlan, shoppingList."
    elif request_type == "leftoverOptimize":
        return f"Suggest recipes using these leftovers: {leftovers}."
    # Extend as needed
    return "Invalid prompt."

class GenAIService:
    def __init__(self):
        self.cerebras_api_key = os.getenv("CEREBRAS_API_KEY")
        self.groq_api_key = os.getenv("GROQ_API_KEY")

    def has_valid_api_key(self):
        return bool(self.cerebras_api_key or self.groq_api_key)

    def format_prompt(self, request_type, data):
        return get_prompt_template(request_type, data)

    def generate_mock_response(self, prompt):
        return '{"recipe_name": "Mock Recipe", "ingredients": ["ingredient1","ingredient2"], "instructions": ["Step 1: Do something","Step 2: Done."], "metadata": {"prepTime":"15m", "cookTime":"25m"}}'

    def generate_recipe(self, prompt, options=None):
        if not self.has_valid_api_key():
            print("No valid API key, using mock response")
            return self.generate_mock_response(prompt)
        # Try Cerebras first
        if self.cerebras_api_key:
            try:
                return self.call_cerebras_api(prompt, options)
            except Exception as e:
                print(f"Cerebras API Error: {str(e)}. Trying Groq provider...")
        # Try Groq as fallback
        if self.groq_api_key:
            try:
                return self.call_groq_api(prompt, options)
            except Exception as e:
                print(f"Groq API Error: {str(e)}. Using mock.")
        # If both fail, fallback to mock
        return self.generate_mock_response(prompt)

    def call_cerebras_api(self, prompt, options=None):
        try:
            from cerebras.cloud.sdk import Cerebras
        except ImportError:
            raise ImportError("You must install cerebras-cloud SDK using `pip install cerebras-cloud`")
        model_name = "llama-4-scout-17b-16e-instruct"
        client = Cerebras(api_key=self.cerebras_api_key)
        system_message = "You are a professional chef and nutritionist AI assistant. Provide detailed, accurate, and helpful recipe suggestions with clear instructions and time required at each step, ingredient lists, and nutritional information."
        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt}
        ]
        chat_completion = client.chat.completions.create(
            messages=messages,
            model=model_name,
            max_tokens=options.get("max_tokens", 2000) if options else 2000,
            temperature=options.get("temperature", 0.7) if options else 0.7,
        )
        return chat_completion.choices[0].message.content

    def call_groq_api(self, prompt, options=None):
        try:
            from groq import Groq
        except ImportError:
            raise ImportError("You must install groq SDK using `pip install groq`")
        client = Groq(api_key=self.groq_api_key)
        messages = [
            {
                "role": "system", 
                "content": "You are a professional chef and nutritionist AI assistant. Provide detailed, accurate, and helpful recipe suggestions with clear instructions and time required at each step, ingredient lists, and nutritional information."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
        completion = client.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=messages,
            temperature=options.get("temperature", 0.7) if options else 0.7,
            max_completion_tokens=options.get("max_tokens", 2000) if options else 2000,
            top_p=1,
            reasoning_effort="medium",
            stream=False,
            stop=None
        )
        return completion.choices[0].message.content