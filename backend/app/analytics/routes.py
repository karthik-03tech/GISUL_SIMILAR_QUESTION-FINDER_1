from datetime import datetime, timedelta, timezone
from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Bookmark, Question, QuestionMatch, Topic, User
from app.auth.dependencies import get_current_user

router = APIRouter()


@router.get("/summary")
def get_summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total_questions = db.query(Question).filter(Question.user_id == user.id).count()

    topics_explored = (
        db.query(func.count(func.distinct(Question.topic_id)))
        .filter(Question.user_id == user.id)
        .scalar()
        or 0
    )

    # avg similarity score across all their matches
    avg_score_row = (
        db.query(func.avg(QuestionMatch.score))
        .join(Question, Question.id == QuestionMatch.question_id)
        .filter(Question.user_id == user.id)
        .scalar()
    )
    avg_similarity_score = round(float(avg_score_row or 0.0), 3)

    # most active topic
    most_active_row = (
        db.query(Topic.name, func.count(Question.id).label("cnt"))
        .join(Question, Question.topic_id == Topic.id)
        .filter(Question.user_id == user.id)
        .group_by(Topic.id, Topic.name)
        .order_by(func.count(Question.id).desc())
        .first()
    )
    most_active_topic = most_active_row[0] if most_active_row else "None"

    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    questions_this_week = (
        db.query(Question)
        .filter(Question.user_id == user.id, Question.created_at >= week_ago)
        .count()
    )

    bookmarks_count = db.query(Bookmark).filter(Bookmark.user_id == user.id).count()

    return {
        "total_questions": total_questions,
        "topics_explored": topics_explored,
        "avg_similarity_score": avg_similarity_score,
        "most_active_topic": most_active_topic,
        "questions_this_week": questions_this_week,
        "bookmarks_count": bookmarks_count,
    }


@router.get("/topic_distribution")
def get_topic_distribution(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Topic.name, Topic.color, func.count(Question.id).label("cnt"))
        .join(Question, Question.topic_id == Topic.id)
        .filter(Question.user_id == user.id)
        .group_by(Topic.id, Topic.name, Topic.color)
        .all()
    )
    total = sum(r.cnt for r in rows) or 1
    return [
        {
            "topic": r.name,
            "color": r.color or "#6b7280",
            "count": r.cnt,
            "percentage": round((r.cnt / total) * 100, 1),
        }
        for r in rows
    ]


@router.get("/activity")
def get_activity(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Last 30 days of activity, filling gaps with 0-count days."""
    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=29)

    rows = (
        db.query(
            func.date(Question.created_at).label("day"),
            func.count(Question.id).label("cnt"),
        )
        .filter(Question.user_id == user.id, Question.created_at >= start)
        .group_by(func.date(Question.created_at))
        .all()
    )
    counts: dict[str, int] = {str(r.day): r.cnt for r in rows}

    result = []
    for i in range(30):
        day_str = str(start + timedelta(days=i))
        result.append({"date": day_str, "count": counts.get(day_str, 0)})
    return result
