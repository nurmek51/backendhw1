from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api.endpoints import tasks
from app.database import create_db_tables

app = FastAPI()

# Create database tables on startup
@app.on_event("startup")
def on_startup():
    create_db_tables()

# Mount the frontend static files
app.mount("/frontend", StaticFiles(directory="frontend", html=True), name="frontend")

# Include API routers with a prefix
app.include_router(tasks.router, prefix="/api")

@app.get("/hello")
async def read_root():
    return {"message": "Hello, World from Backend!"}

@app.get("/status")
async def get_status():
    return {"status": "ok"}
