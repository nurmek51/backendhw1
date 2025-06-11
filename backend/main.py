import requests
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from celery import Celery

from app.api.endpoints import tasks, auth, chatbot
from app.database import create_db_tables, get_db
from app.crud import fetched_data
from app.schemas.fetched_data import FetchedData as FetchedDataSchema

app = FastAPI()

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

@celery_app.task(name="app.main.fetch_daily_data_task")
def fetch_daily_data_task():
    print("Daily data fetching task executed!")
    try:
        response = requests.get("https://jsonplaceholder.typicode.com/posts/1") # Example API endpoint
        response.raise_for_status() # Raise an HTTPError for bad responses (4xx or 5xx)
        data = response.json()

        # Create a Pydantic schema instance for validation/typing
        fetched_item = FetchedDataSchema(title=data.get("title"), body=data.get("body"), id=data.get("id"))

        db = next(get_db())
        crud_response = fetched_data.create_fetched_data(db, fetched_item)
        print(f"Data saved to DB: {crud_response.title}")
        return "Data fetched and saved successfully"
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return f"Failed to fetch data: {e}"
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return f"An unexpected error occurred: {e}"
