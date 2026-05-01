import os
import json
import asyncio
from fastapi import FastAPI
import redis.asyncio as redis

app = FastAPI()

redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379")

async def redis_listener():
    try:
        r = redis.from_url(redis_url)
        pubsub = r.pubsub()
        await pubsub.subscribe("notifications")
        print("Subscribed to 'notifications' channel in Redis.", flush=True)
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                print(f"Received notification: {data}", flush=True)
                # Simulate sending a push notification
                print(f"Pushing notification to user {data.get('userId')}: {data.get('message')}", flush=True)
    except Exception as e:
        print(f"Redis listener error: {e}", flush=True)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(redis_listener())

@app.get("/")
def read_root():
    return {"status": "ok", "service": "Notification Service"}
