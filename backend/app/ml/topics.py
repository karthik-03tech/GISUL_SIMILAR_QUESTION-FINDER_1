import numpy as np
from sqlalchemy.orm import Session
from app.db.models import Topic
from app.ml.embeddings import embed_batch, cosine_similarity_single
from app.seed_data import TOPIC_SEED_EXAMPLES, TOPIC_COLORS


def compute_centroids() -> dict[str, list[float]]:
    """Embed seed questions per topic and average into a centroid vector."""
    centroids: dict[str, list[float]] = {}
    for name, questions in TOPIC_SEED_EXAMPLES.items():
        print(f"  Computing centroid for: {name}…")
        embeddings = embed_batch(questions)
        mean_embedding = np.mean(embeddings, axis=0)
        centroids[name] = mean_embedding.tolist()
    return centroids


def seed_topics(db: Session) -> None:
    """
    Seed the topics table with names, centroids, and colors.
    Skips entirely if any topics already exist.
    """
    if db.query(Topic).count() > 0:
        print("✓ Topics already seeded")
        return

    print("  Seeding topics…")
    centroids = compute_centroids()
    for name, centroid in centroids.items():
        color = TOPIC_COLORS.get(name)
        db.add(Topic(name=name, centroid=centroid, color=color))
    db.commit()
    print(f"✓ Topics seeded ({len(centroids)} topics)")


def assign_topic(embedding: list[float], db: Session) -> tuple[Topic, float]:
    """
    Compare a question's embedding with all topic centroids.
    Returns (best_topic, confidence_score).
    """
    topics = db.query(Topic).all()
    if not topics:
        raise ValueError("No topics found. Please seed topics first.")

    valid = [t for t in topics if t.centroid is not None]
    if not valid:
        raise ValueError("No topics with valid centroids.")

    best_topic: Topic | None = None
    best_score = -1.0
    for t in valid:
        score = cosine_similarity_single(embedding, t.centroid)
        if score > best_score:
            best_score = score
            best_topic = t

    return best_topic, best_score  # type: ignore[return-value]
