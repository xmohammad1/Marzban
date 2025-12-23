from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class XRayConfigTemplateBase(BaseModel):
    name: str = Field(min_length=1, max_length=256)
    config: dict


class XRayConfigTemplateCreate(XRayConfigTemplateBase):
    pass


class XRayConfigTemplateUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=256)
    config: Optional[dict] = None


class XRayConfigTemplateResponse(XRayConfigTemplateBase):
    id: int
    created_at: datetime
    nodes_count: int = 0

    class Config:
        from_attributes = True
