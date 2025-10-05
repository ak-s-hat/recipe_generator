from fastapi import FastAPI, Request
from genai_service import GenAIService
from agents import orchestrate_agents
from utils import validate_ingredients, parse_llm_response
import uvicorn

app = FastAPI()
genai_service = GenAIService()


@app.get("/")
def read_root():
    return {"message": "FastAPI is running"}



@app.post("/generate")
async def generate(request: Request):
 data = await request.json()
 valid, error_payload = validate_ingredients(data)
 if not valid:
  return error_payload
 # Single recipe (default)
 out = orchestrate_agents(data, mode="recipe")
 return {"data": out}


@app.post("/orchestrate")
async def orchestrate(request: Request):
 data = await request.json()
 # Pass mode: "recipe" or "mealplan" from user choice/input
 mode = data.get("mode", "recipe")
 out = orchestrate_agents(data, mode=mode)
 return {"data": out}


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)