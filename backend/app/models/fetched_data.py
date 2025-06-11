from sqlalchemy import Column, Integer, String
from app.database import Base

class DBFetchedData(Base):
    __tablename__ = "fetched_data"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    body = Column(String, nullable=True) 