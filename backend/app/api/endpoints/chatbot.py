from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
from app.assistant.gemini_client import get_gemini_response

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, Any]] = []

class ChatResponse(BaseModel):
    response: str
    updated_history: List[Dict[str, Any]]

@router.post("/chatbot/", response_model=ChatResponse)
async def chat_with_assistant(request: ChatRequest):
    gemini_result = get_gemini_response(request.message, request.history)
    return {"response": gemini_result["response"], "updated_history": gemini_result["history"]} 