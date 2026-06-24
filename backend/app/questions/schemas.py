from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class QuestionCreateRequest(BaseModel):
    question_text: str = Field(..., min_length=5, max_length=2000)

    @field_validator("question_text")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        stripped = v.strip()
        if len(stripped) < 5:
            raise ValueError("question_text must be at least 5 non-whitespace characters")
        return stripped


class SimilarQuestionOut(BaseModel):
    id: UUID
    question_text: str
    score: float
    score_percent: int
    explanation: str
    topic: str

    model_config = {"from_attributes": True}


class QuestionResponse(BaseModel):
    id: UUID
    question_text: str
    topic: str
    topic_color: str
    confidence: float
    similar_questions: list[SimilarQuestionOut]
    created_at: datetime

    model_config = {"from_attributes": True}


class HistoryItem(BaseModel):
    id: UUID
    question_text: str
    topic: str
    topic_color: str
    confidence: float
    match_count: int
    is_bookmarked: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedHistory(BaseModel):
    items: list[HistoryItem]
    total: int
    page: int
    limit: int
    has_more: bool


class QuestionHistoryItem(BaseModel):
    """Backward-compat alias."""
    id: UUID
    question_text: str
    topic: str
    topic_color: str
    confidence: Optional[float] = None
    match_count: int
    is_bookmarked: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class BulkQuestionCreateRequest(BaseModel):
    questions: list[str] = Field(..., min_length=1, max_length=100)

class BulkQuestionCreateResponse(BaseModel):
    added_count: int
