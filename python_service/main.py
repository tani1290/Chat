from fastapi import FastAPI, Request
from pydantic import BaseModel
import aioredis
import json
import os

app = FastAPI()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

class CommentRequest(BaseModel):
    text: str

# Basic Comment Safety Engine (MVP)
BAD_WORDS = {"spam", "abuse", "harass", "profanity", "kill", "idiot"}

@app.post("/filter")
async def filter_comment(req: CommentRequest):
    text_lower = req.text.lower()
    
    # 1. Profanity & Harassment Check
    is_flagged = any(bad_word in text_lower for bad_word in BAD_WORDS)
    
    # 2. Spam / Repetition Check (mocked as length check for MVP)
    if len(text_lower) > 500:
        is_flagged = True

    return {
        "isFlagged": is_flagged,
        "reason": "Violates safety guidelines" if is_flagged else None
    }

@app.on_event("startup")
async def startup_event():
    print("Python Microservice Started - Listening for notifications and filtering comments.")
    # Redis subscription would go here if needed
