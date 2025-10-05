import json
import re

def validate_ingredients(data):
    ingredients = data.get("ingredients")
    if not ingredients or (isinstance(ingredients, str) and not ingredients.strip()):
        return False, {"error": "Ingredients are required", "message": "Please provide at least one ingredient"}
    return True, {}
def parse_llm_response(response_str):
    import json
    import re

    # Try to extract JSON inside triple backtick code block labeled "json"
    code_block = re.search(r"``````", response_str, re.DOTALL)
    if code_block:
        try:
            return json.loads(code_block.group(1))
        except Exception:
            pass
    # If not, try to find the first {...} block
    first_json = re.search(r"(\{.*?\})", response_str, re.DOTALL)
    if first_json:
        try:
            return json.loads(first_json.group(1))
        except Exception:
            pass
    # Try full string as fallback
    try:
        return json.loads(response_str)
    except Exception:
        return {
            "raw_output": response_str
        }

def get_missing_ingredients(recipe_ingredients, user_ingredients):
    """Return items in recipe_ingredients not in user_ingredients."""
    user_set = set(x.strip().lower() for x in user_ingredients)
    return [item for item in recipe_ingredients if item.strip().lower() not in user_set]
