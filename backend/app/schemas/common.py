from typing import Any, Generic, List, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T


class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail


class ErrorDetail(BaseModel):
    code: str
    message: str


class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    data: List[T]
    pagination: Pagination


class Pagination(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int


class MessageResponse(BaseModel):
    success: bool = True
    message: str
