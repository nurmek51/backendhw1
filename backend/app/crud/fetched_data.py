from sqlalchemy.orm import Session
from app.models.fetched_data import DBFetchedData
from app.schemas.fetched_data import FetchedData as FetchedDataSchema

def create_fetched_data(db: Session, data: FetchedDataSchema):
    db_fetched_data = DBFetchedData(title=data.title, body=data.body)
    db.add(db_fetched_data)
    db.commit()
    db.refresh(db_fetched_data)
    return db_fetched_data

def get_fetched_data(db: Session, data_id: int):
    return db.query(DBFetchedData).filter(DBFetchedData.id == data_id).first()

def get_all_fetched_data(db: Session, skip: int = 0, limit: int = 100):
    return db.query(DBFetchedData).offset(skip).limit(limit).all() 