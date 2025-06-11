import requests
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from celery import Celery
import redis
import json
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints import tasks, auth, chatbot
from app.database import create_db_tables, get_db
from app.crud import fetched_data
from app.schemas.fetched_data import FetchedData as FetchedDataSchema

app = FastAPI()

# Configure CORS
origins = [
    "http://localhost:8000",
    "http://0.0.0.0:8000",
    "*",
    "34.51.137.41"
    # You might need to add other origins if your frontend is served from a different URL/port
    # For example, if deployed to a specific domain: "https://your-frontend-domain.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Celery
celery_app = Celery(
    "backend",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/0"
)

# Celery Beat settings
celery_app.conf.beat_schedule = {
    'fetch-data-every-day': {
        'task': 'app.main.fetch_daily_data_task',
        'schedule': 86400.0,  # Every 24 hours
        'args': ()
    },
}
celery_app.conf.timezone = 'UTC'

# Initialize Redis client for caching
redis_client = redis.StrictRedis(host='redis', port=6379, db=1)
CACHE_EXPIRATION = 60 * 60 * 24 # Cache for 24 hours

# Create database tables on startup
@app.on_event("startup")
def on_startup():
    create_db_tables()

# Mount the frontend static files
app.mount("/frontend", StaticFiles(directory="frontend", html=True), name="frontend")

# Include API routers with a prefix
app.include_router(tasks.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(chatbot.router, prefix="/api")

@app.get("/hello")
async def read_root():
    return {"message": "Hello, World from Backend!"}

@app.get("/status")
async def get_status():
    return {"status": "ok"}

@app.get("/api/daily-data")
async def get_daily_data_from_task():
    return fetch_daily_data_task()

@celery_app.task(name="app.main.fetch_daily_data_task")
def fetch_daily_data_task():
    print("Daily data fetching task executed!")
    
    cache_key = "daily_fetched_data"
    
    # Try to retrieve from cache
    cached_data = redis_client.get(cache_key)
    if cached_data:
        print("Data fetched from cache.")
        return {"status": "success", "source": "cache", "data": json.loads(cached_data)}
        
    try:
        response = requests.get("https://jsonplaceholder.typicode.com/posts/1") # Example API endpoint
        response.raise_for_status() # Raise an HTTPError for bad responses (4xx or 5xx)
        data = response.json()

        # Create a Pydantic schema instance for validation/typing
        fetched_item = FetchedDataSchema(title=data.get("title"), body=data.get("body"), id=data.get("id"))

        db = next(get_db())
        crud_response = fetched_data.create_fetched_data(db, fetched_item)
        print(f"Data saved to DB: {crud_response.title}")
        
        # Cache the fetched data
        redis_client.setex(cache_key, CACHE_EXPIRATION, json.dumps(data))
        print("Data saved to cache.")
        
        return {"status": "success", "source": "api", "data": data}
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return {"status": "error", "message": f"Failed to fetch data: {e}"}
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return {"status": "error", "message": f"An unexpected error occurred: {e}"}
