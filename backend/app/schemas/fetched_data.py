from pydantic import BaseModel
from typing import Optional

class FetchedData(BaseModel):
    id: Optional[int] = None
    title: str
    body: Optional[str] = None

    class Config:
        from_attributes = True # for Pydantic v2+ 