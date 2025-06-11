import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session

# Database Configuration
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/your_db_name")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Function to create tables (will be called from main.py or startup)
def create_db_tables():
    # Import all models here so that Base.metadata.create_all knows them
    from app.models.task import DBTask  # noqa: F401
    from app.models.user import DBUser # noqa: F401
    from app.models.fetched_data import DBFetchedData # noqa: F401
    Base.metadata.create_all(bind=engine) 