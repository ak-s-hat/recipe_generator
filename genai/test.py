import json
from agents import orchestrate_agents
from genai_service import GenAIService

def manual_generate_recipe():
    genai_service = GenAIService()
    print("=== Manual Recipe Generation ===")
    ingredients = input("Enter ingredients (comma separated): ").strip()
    preferences = input("Enter dietary preferences (comma separated): ").strip()
    allergies = input("Enter allergies (comma separated): ").strip()
    budget = input("Enter budget (leave blank if none): ").strip()
    leftovers = input("Enter leftovers (comma separated, blank if none): ").strip()
    data = {
        "ingredients": [i.strip() for i in ingredients.split(",") if i.strip()],
        "preferences": preferences,
        "allergies": allergies,
        "budget": budget,
        "leftovers": leftovers,
        "requestType": "recipe"
    }
    prompt = genai_service.format_prompt("recipe", data)
    result = genai_service.generate_recipe(prompt, options={"max_tokens": 2500, "temperature": 0.7})
    print("\nLLM Response:\n", result)

def manual_agent_orchestration():
    print("=== Agentic Workflow Test ===")
    ingredients = input("Enter ingredients (comma separated): ").strip()
    preferences = input("Enter dietary preferences (comma separated): ").strip()
    allergies = input("Enter allergies (comma separated): ").strip()
    budget = input("Enter budget (leave blank if none): ").strip()
    leftovers = input("Enter leftovers (comma separated, blank if none): ").strip()
    data = {
        "ingredients": [i.strip() for i in ingredients.split(",") if i.strip()],
        "preferences": preferences,
        "allergies": allergies,
        "budget": budget,
        "leftovers": leftovers,
    }
    mode = input("Enter mode (recipe/mealplan): ").strip()
    results = orchestrate_agents(data, mode=mode)
    print("\nAgent Results:\n")
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    print("1. Test LLM Recipe Generation")
    print("2. Test Full Agentic Orchestration")
    choice = input("Choose (1/2): ").strip()
    if choice == "1":
        manual_generate_recipe()
    elif choice == "2":
        manual_agent_orchestration()
    else:
        print("Invalid choice!")
