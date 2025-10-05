from genai_service import GenAIService
import json
from utils import parse_llm_response, get_missing_ingredients
import os
from cerebras.cloud.sdk import Cerebras
from dotenv import load_dotenv

load_dotenv()
genai_service = GenAIService()

# Example for SINGLE RECIPE
single_recipe_example = '''
{
  "recipe_name": "Tomato Egg Toast",
  "ingredients": {
    "eggs": 1,
    "bread": 2,
    "butter": 0,
    "tomato": 1,
    "onion": "1/4"
  },
  "missing_ingredients": ["salt (optional, for taste)"],
  "instructions": [
    "Toast the bread until it's lightly browned.",
    "Wash and slice the tomato into thin pieces.",
    "Chop the onion finely.",
    "Use a non-stick pan (to avoid oily food) and add a small amount of water (about 1 tablespoon).",
    "Crack the egg into the pan and cook until the whites are set and the yolks are cooked to your liking.",
    "Assemble the dish by placing the toasted bread on a plate, topping it with a slice of tomato, a sprinkle of chopped onion, and finally the fried egg.",
    "If using, sprinkle a pinch of salt for taste."
  ],
  "nutritious_values": {
    "calories": "approx 220",
    "protein": "14g",
    "fat": "4g",
    "carbohydrates": "35g",
    "fiber": "3g",
    "sugar": "5g"
  }
}
'''.strip()

# Example for MEAL PLAN
mealplan_example = '''
{
  "plan_name": "Low Carb Week Plan",
  "meal_plan": [
    {"day": 1, "recipe_name": "Egg Veggie Toast", "instructions": "Toast bread, scramble eggs with veggies, assemble."},
    {"day": 2, "recipe_name": "Capsicum Omelette", "instructions": "Make omelette using eggs and capsicum."},
    {"day": 3, "recipe_name": "Potato Frittata", "instructions": "Shred potato, mix with eggs, cook frittata."},
    {"day": 4, "recipe_name": "Milk Curd Smoothie", "instructions": "Blend milk and curd with cinnamon."},
    {"day": 5, "recipe_name": "Bread Upma", "instructions": "Toast bread cubes, sauté with eggs and veggies."},
    {"day": 6, "recipe_name": "Onion Paratha", "instructions": "Knead dough, mix onions, pan fry."},
    {"day": 7, "recipe_name": "Baked Potato and Eggs", "instructions": "Bake potatoes and eggs together."}
  ],
  "shopping_list": [
    "eggs", "onion", "butter", "capsicum", "bread", "potato", "milk", "curd"
  ],
  "nutritious_values": {
    "weekly_calories": "approx 2200",
    "protein": "60g",
    "fat": "25g",
    "carbohydrates": "300g",
    "fiber": "15g"
  },
  "missing_ingredients": []
}
'''.strip()
def construct_custom_prompt(data, mode="recipe"):
    ingredients = data.get("ingredients", [])
    allergies = data.get("allergies", "")
    preferences = data.get("preferences", "")
    budget = data.get("budget", "")
    leftovers = data.get("leftovers", "")

    prompt = []
    prompt.append("You are an expert chef and nutrition assistant.")

    # Always include ingredients
    prompt.append(f"Create a recipe using ONLY these ingredients: {', '.join(ingredients)}.")

    if preferences:
        prompt.append(f"Tailor the recipe to these dietary preferences: {preferences}.")
    if allergies:
        prompt.append(f"STRICTLY avoid any allergens: {allergies}, and substitute/omit related ingredients.")
    if budget:
        prompt.append(f"Ensure the recipe fits within a budget of {budget}.")
    if leftovers:
        prompt.append(f"If possible, creatively use these leftovers: {leftovers}.")

    # Output instructions based on mode
    if mode == "mealplan":
        prompt.append("Generate a 7-day meal plan, using the constraints above. Output each day as a recipe name and brief instructions in a JSON object as described below.")
        prompt.append("Your output must be valid JSON in this format: {\"plan_name\": str, \"meal_plan\": [{\"day\": int, \"recipe_name\": str, \"instructions\": str}], \"shopping_list\": [...], \"nutritious_values\": {...}, \"missing_ingredients\": [...]}.")
    else:
        prompt.append("Output a SINGLE recipe in JSON format with: recipe_name, ingredients, instructions, nutritious_values.")
        prompt.append("If any required ingredients are missing from the original list, add them in a field 'missing_ingredients' in the same JSON.")

    return " ".join(prompt)


def normalize_llm_output_with_cerebras(raw_text, mode="recipe"):
    if mode == "mealplan":
        example_output = mealplan_example
        schema_fields = '''
Output EXACTLY one top-level JSON with the following fields:
{
  "plan_name": string,
  "meal_plan": list,
  "shopping_list": list,
  "nutritious_values": dict,
  "missing_ingredients": list
}
'''
    else:
        example_output = single_recipe_example
        schema_fields = '''
Output EXACTLY one top-level JSON with the following fields:
{
  "recipe_name": string,
  "ingredients": dict or list,
  "missing_ingredients": list,
  "instructions": list,
  "nutritious_values": dict
}
'''

    system_instructions = f"""
You are an API that strictly outputs JSON for recipe generation.

TASK:
- Input: A raw text block with a recipe/mealplan, which may include markdown, explanations, embedded JSON, and notes.
- Output: Extract and clean ONLY displayable JSON for the section requested, strip markdown, extra text, explanations.
- {schema_fields}
- Ignore notes, budget, explanations. If missing, fill with blank type.
- Example Input: (actual messy response block here)
'''RAW MESSY BLOCK HERE'''
- Example Output (desired format, strictly JSON!):
{example_output}

Strictly return only JSON, no markdown, no extra explanation.
"""
    client = Cerebras(api_key=os.environ.get("CEREBRAS_API_KEY"))
    model_name = "llama-4-scout-17b-16e-instruct"
    messages = [
        {"role": "system", "content": system_instructions},
        {"role": "user", "content": raw_text}
    ]
    resp = client.chat.completions.create(
        messages=messages,
        model=model_name,
        max_tokens=1500,
        temperature=0.1,
    )
    return resp.choices[0].message.content

def orchestrate_agents(data, mode="recipe"):
    prompt = construct_custom_prompt(data, mode)
    raw_response = genai_service.generate_recipe(prompt)
    cleaned_json_str = normalize_llm_output_with_cerebras(raw_response, mode=mode)
    json_out = parse_llm_response(cleaned_json_str)
    # Optionally add missing ingredients if not provided by LLM (for single recipe only)
    if mode == "recipe" and "ingredients" in json_out and "missing_ingredients" not in json_out:
        user_ings = data.get("ingredients", [])
        recipe_ings = json_out.get("ingredients", [])
        if isinstance(recipe_ings, dict):
            recipe_ings = list(recipe_ings.keys())
        auto_missing = get_missing_ingredients(recipe_ings, user_ings)
        if auto_missing:
            json_out["missing_ingredients"] = auto_missing
    return json_out
