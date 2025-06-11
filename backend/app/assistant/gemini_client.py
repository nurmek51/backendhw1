import os
from typing import List, Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage

# Helper function to convert LangChain messages to simple dictionaries for Pydantic
def _serialize_lc_message(message: Any) -> Dict[str, Any]:
    """Converts a LangChain message object (HumanMessage, AIMessage) to a dictionary."""
    if isinstance(message, HumanMessage):
        return {"role": "user", "parts": [{"text": message.content}]}
    elif isinstance(message, AIMessage):
        return {"role": "model", "parts": [{"text": message.content}]}
    elif isinstance(message, dict) and "role" in message and "parts" in message:
        # If it's already a dictionary (e.g., from frontend input), return as is
        return message
    return {"role": "system", "parts": [{"text": str(message)}]} # Fallback for unexpected types

def get_gemini_response(prompt: str, history: List[Dict]) -> Dict:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"response": "Error: Gemini API key not set. Please set the GEMINI_API_KEY environment variable.", "history": history}

    # Convert incoming history (from frontend dicts) to LangChain message objects
    lc_history = []
    for item in history:
        if item.get("role") == "user":
            lc_history.append(HumanMessage(content=item.get("parts", [{}])[0].get("text", "")))
        elif item.get("role") == "model":
            lc_history.append(AIMessage(content=item.get("parts", [{}])[0].get("text", "")))
    
    llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=api_key)

    try:
        # Invoke the LangChain model with history and current prompt
        full_history = lc_history + [HumanMessage(content=prompt)]
        response_message = llm.invoke(full_history)
        
        # LangChain's response_message is an AIMessage object. Convert to dict.
        serialized_response = _serialize_lc_message(response_message) # This will be the AI's current response

        # The full conversation history including the new turn
        updated_lc_history = lc_history + [HumanMessage(content=prompt), response_message]
        serialized_history_for_frontend = [_serialize_lc_message(item) for item in updated_lc_history]

        return {"response": serialized_response["parts"][0]["text"], "history": serialized_history_for_frontend}
    except Exception as e:
        return {"response": f"Error interacting with Gemini API: {e}", "history": history} 