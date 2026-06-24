"""
Question submission orchestrator — now async with optional WebSocket progress.
"""
from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy.orm import Session

from app.db.models import User, Question, QuestionMatch
from app.ml.embeddings import embed_text
from app.ml.qdrant_client import search_similar, upsert_vector
from app.ml.topics import assign_topic
from app.ml.explainer import explain_similarity
from app.questions.schemas import SimilarQuestionOut, QuestionResponse


async def submit_question(
    text: str,
    user: User,
    db: Session,
    client_id: Optional[str] = None,
) -> QuestionResponse:
    """
    Full pipeline:
      embed → search Qdrant → assign topic → save → store matches → upsert vector
    Sends WebSocket progress messages when client_id is provided.
    """
    from app.ws.manager import manager  # late import to avoid circular

    async def _progress(step: str, detail: str = "") -> None:
        if client_id:
            await manager.send_progress(client_id, step, detail)

    # 1 — embed
    embedding = embed_text(text)
    await _progress("embedding", "Analysing your question...")

    # 2 — search BEFORE saving (new question can't match itself)
    similar_raw = search_similar(embedding, top_k=5, min_score=0.5, exclude_id=None)
    await _progress("searching", "Searching for similar questions...")

    # 3 — fetch matching Question rows from Postgres
    matched_uuids = []
    for qid, _ in similar_raw:
        try:
            matched_uuids.append(uuid.UUID(qid))
        except ValueError:
            continue

    matched_qs = db.query(Question).filter(Question.id.in_(matched_uuids)).all()
    lookup: dict[str, Question] = {str(q.id): q for q in matched_qs}

    # 4 — topic + confidence
    topic, confidence = assign_topic(embedding, db)
    await _progress("tagging", "Assigning topic...")

    # 5 — persist new question
    new_q = Question(
        user_id=user.id,
        question_text=text,
        topic_id=topic.id,
        confidence=confidence,
    )
    db.add(new_q)
    db.commit()
    db.refresh(new_q)

    # 6 — build matches + explanations
    matches_out: list[SimilarQuestionOut] = []
    for qid, score in similar_raw:
        mq = lookup.get(qid)
        if not mq:
            continue
        explanation = explain_similarity(text, mq.question_text)
        try:
            db.add(
                QuestionMatch(
                    question_id=new_q.id,
                    matched_question_id=uuid.UUID(qid),
                    score=score,
                    explanation=explanation,
                )
            )
        except ValueError:
            continue
        matches_out.append(
            SimilarQuestionOut(
                id=uuid.UUID(qid),
                question_text=mq.question_text,
                score=score,
                score_percent=round(score * 100),
                explanation=explanation,
                topic=mq.topic.name if mq.topic else "Unknown",
            )
        )
    db.commit()
    await _progress("saving", "Saving results...")

    # 7 — upsert to Qdrant
    upsert_vector(
        str(new_q.id),
        embedding,
        payload={
            "user_id": str(user.id),
            "topic": topic.name,
            "topic_id": topic.id,
        },
    )

    await _progress("done", "Complete")

    # 8 — return
    return QuestionResponse(
        id=new_q.id,
        question_text=text,
        topic=topic.name,
        topic_color=topic.color or "#6b7280",
        confidence=confidence,
        similar_questions=matches_out,
        created_at=new_q.created_at,
    )
