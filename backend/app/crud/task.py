from sqlalchemy.orm import Session
from app.models.task import DBTask
from app.schemas.task import Task as TaskSchema

def get_task(db: Session, task_id: int):
    return db.query(DBTask).filter(DBTask.id == task_id).first()

def get_tasks(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(DBTask).filter(DBTask.user_id == user_id).offset(skip).limit(limit).all()

def create_task(db: Session, task: TaskSchema, user_id: int):
    db_task = DBTask(title=task.title, description=task.description, completed=task.completed, user_id=user_id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def update_task(db: Session, task_id: int, task: TaskSchema):
    db_task = db.query(DBTask).filter(DBTask.id == task_id).first()
    if db_task:
        for key, value in task.model_dump(exclude_unset=True).items():
            setattr(db_task, key, value)
        db.commit()
        db.refresh(db_task)
        return db_task
    return None

def delete_task(db: Session, task_id: int):
    db_task = db.query(DBTask).filter(DBTask.id == task_id).first()
    if db_task:
        db.delete(db_task)
        db.commit()
        return True
    return False 