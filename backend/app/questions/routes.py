from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Bookmark, Question, QuestionMatch, Topic, User
from app.auth.dependencies import get_current_user
from app.ml.embeddings import embed_text
from app.ml.qdrant_client import search_similar, delete_vector, upsert_vector
from app.ml.topics import assign_topic
from app.questions.schemas import (
    HistoryItem,
    PaginatedHistory,
    QuestionCreateRequest,
    QuestionResponse,
    SimilarQuestionOut,
    BulkQuestionCreateRequest,
    BulkQuestionCreateResponse,
)
from app.questions.service import submit_question

router = APIRouter()


# ── helpers ───────────────────────────────────────────────────────────────────

def _bookmark_set(user_id, db: Session) -> set[str]:
    rows = db.query(Bookmark.question_id).filter(Bookmark.user_id == user_id).all()
    return {str(r[0]) for r in rows}


def _build_history_item(q: Question, match_count: int, bookmarked: bool) -> HistoryItem:
    return HistoryItem(
        id=q.id,
        question_text=q.question_text,
        topic=q.topic.name if q.topic else "Unknown",
        topic_color=(q.topic.color if q.topic else None) or "#6b7280",
        confidence=q.confidence or 0.0,
        match_count=match_count,
        is_bookmarked=bookmarked,
        created_at=q.created_at,
    )


# ── routes ────────────────────────────────────────────────────────────────────

@router.post("", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    payload: QuestionCreateRequest,
    client_id: Optional[str] = Query(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await submit_question(payload.question_text, user, db, client_id=client_id)


@router.post("/bulk", response_model=BulkQuestionCreateResponse, status_code=status.HTTP_201_CREATED)
def create_questions_bulk(
    payload: BulkQuestionCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    added = 0
    for text in payload.questions:
        text = text.strip()
        if len(text) < 5:
            continue
        
        embedding = embed_text(text)
        topic, confidence = assign_topic(embedding, db)
        
        new_q = Question(
            user_id=user.id,
            question_text=text,
            topic_id=topic.id,
            confidence=confidence,
        )
        db.add(new_q)
        db.commit()
        db.refresh(new_q)
        
        upsert_vector(
            str(new_q.id),
            embedding,
            payload={
                "user_id": str(user.id),
                "topic": topic.name,
                "topic_id": topic.id,
            },
        )
        added += 1
        
    return BulkQuestionCreateResponse(added_count=added)


@router.get("/history", response_model=PaginatedHistory)
def get_question_history(
    topic: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Question).filter(Question.user_id == user.id)

    if topic:
        target_topic = (
            db.query(Topic).filter(func.lower(Topic.name) == topic.lower()).first()
        )
        if not target_topic:
            return PaginatedHistory(items=[], total=0, page=page, limit=limit, has_more=False)
        query = query.filter(Question.topic_id == target_topic.id)

    if search:
        query = query.filter(Question.question_text.ilike(f"%{search}%"))

    total = query.count()
    questions = (
        query.order_by(Question.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    bookmarked = _bookmark_set(user.id, db)
    items = []
    for q in questions:
        match_count = db.query(QuestionMatch).filter(QuestionMatch.question_id == q.id).count()
        items.append(_build_history_item(q, match_count, str(q.id) in bookmarked))

    return PaginatedHistory(
        items=items,
        total=total,
        page=page,
        limit=limit,
        has_more=(page * limit) < total,
    )


@router.get("/search", response_model=list[HistoryItem])
def semantic_search(
    q: str = Query(..., min_length=3),
    limit: int = Query(default=10, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Semantic search: embed q, find similar vectors, return matching rows."""
    embedding = embed_text(q)
    similar_raw = search_similar(embedding, top_k=limit, min_score=0.4)

    matched_uuids = []
    for qid, _ in similar_raw:
        try:
            matched_uuids.append(uuid.UUID(qid))
        except ValueError:
            continue

    questions = (
        db.query(Question)
        .filter(Question.id.in_(matched_uuids), Question.user_id == user.id)
        .all()
    )
    lookup = {str(q2.id): q2 for q2 in questions}
    bookmarked = _bookmark_set(user.id, db)

    items = []
    for qid, _ in similar_raw:
        q2 = lookup.get(qid)
        if not q2:
            continue
        mc = db.query(QuestionMatch).filter(QuestionMatch.question_id == q2.id).count()
        items.append(_build_history_item(q2, mc, qid in bookmarked))
    return items


@router.get("/{question_id}", response_model=QuestionResponse)
def get_question_detail(
    question_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    question = (
        db.query(Question)
        .filter(Question.id == question_id, Question.user_id == user.id)
        .first()
    )
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    matches = db.query(QuestionMatch).filter(QuestionMatch.question_id == question.id).all()
    similar_questions: list[SimilarQuestionOut] = []
    for match in matches:
        mq = db.query(Question).filter(Question.id == match.matched_question_id).first()
        if mq:
            similar_questions.append(
                SimilarQuestionOut(
                    id=mq.id,
                    question_text=mq.question_text,
                    score=match.score,
                    score_percent=round(match.score * 100),
                    explanation=match.explanation or "",
                    topic=mq.topic.name if mq.topic else "Unknown",
                )
            )
    similar_questions.sort(key=lambda x: x.score, reverse=True)

    return QuestionResponse(
        id=question.id,
        question_text=question.question_text,
        topic=question.topic.name if question.topic else "Unknown",
        topic_color=(question.topic.color if question.topic else None) or "#6b7280",
        confidence=question.confidence or 0.0,
        similar_questions=similar_questions,
        created_at=question.created_at,
    )


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    question_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    question = (
        db.query(Question)
        .filter(Question.id == question_id, Question.user_id == user.id)
        .first()
    )
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    db.query(QuestionMatch).filter(QuestionMatch.question_id == question_id).delete()
    db.delete(question)
    db.commit()

    try:
        delete_vector(str(question_id))
    except Exception:
        pass  # best-effort


@router.post("/{question_id}/bookmark")
def toggle_bookmark(
    question_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(Bookmark)
        .filter(Bookmark.user_id == user.id, Bookmark.question_id == question_id)
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()
        return {"bookmarked": False}
    else:
        db.add(Bookmark(user_id=user.id, question_id=question_id))
        db.commit()
        return {"bookmarked": True}
