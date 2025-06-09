from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.schemas.task import Task as TaskSchema
from app.crud import task as crud
from app.database import get_db
from app.auth.auth_handler import get_current_user
from app.schemas.user import UserInDB

router = APIRouter()

@router.post("/tasks/", response_model=TaskSchema)
def create_task(
    task: TaskSchema,
    current_user: UserInDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud.create_task(db=db, task=task, user_id=current_user.id)

@router.get("/tasks/", response_model=List[TaskSchema])
def read_tasks(
    skip: int = 0,
    limit: int = 100,
    current_user: UserInDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tasks = crud.get_tasks(db, user_id=current_user.id, skip=skip, limit=limit)
    return tasks

@router.get("/tasks/{task_id}", response_model=TaskSchema)
def read_task(
    task_id: int,
    current_user: UserInDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_task = crud.get_task(db, task_id=task_id)
    if db_task is None or db_task.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found or not authorized")
    return db_task

@router.put("/tasks/{task_id}", response_model=TaskSchema)
def update_task(
    task_id: int,
    task: TaskSchema,
    current_user: UserInDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_task = crud.get_task(db, task_id=task_id)
    if db_task is None or db_task.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found or not authorized")
    return crud.update_task(db, task_id=task_id, task=task)

@router.delete("/tasks/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    current_user: UserInDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_task = crud.get_task(db, task_id=task_id)
    if db_task is None or db_task.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Task not found or not authorized")
    success = crud.delete_task(db, task_id=task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return 