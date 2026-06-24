"""
Qdrant vector-store wrapper.
Exposes: ensure_collection, upsert_vector, search_similar, delete_vector
"""
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from qdrant_client.http.exceptions import UnexpectedResponse
from app.core.config import settings

_client = QdrantClient(url=settings.QDRANT_URL, api_key=settings.QDRANT_API_KEY)
COLLECTION = settings.QDRANT_COLLECTION


def ensure_collection() -> None:
    """Create the collection if it doesn't exist. Safe to call every startup."""
    try:
        _client.get_collection(COLLECTION)
        print(f"✓ Qdrant collection '{COLLECTION}' ready")
    except (UnexpectedResponse, Exception) as exc:
        print(f"  Qdrant collection '{COLLECTION}' missing, creating… ({exc})")
        _client.create_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        )
        print(f"✓ Qdrant collection '{COLLECTION}' created")


def upsert_vector(question_id: str, embedding: list[float], payload: dict) -> None:
    _client.upsert(
        collection_name=COLLECTION,
        points=[PointStruct(id=question_id, vector=embedding, payload=payload)],
    )


def search_similar(
    embedding: list[float],
    top_k: int = 5,
    min_score: float = 0.5,
    exclude_id: str | None = None,
) -> list[tuple[str, float]]:
    limit = top_k + (1 if exclude_id else 0)
    try:
        response = _client.query_points(
            collection_name=COLLECTION,
            query=embedding,
            limit=limit,
        )
        results = response.points
    except (UnexpectedResponse, Exception) as exc:
        print(f"Qdrant query failed: {exc}")
        return []

    out: list[tuple[str, float]] = []
    for hit in results:
        hit_id = str(hit.id)
        if exclude_id and hit_id == str(exclude_id):
            continue
        if hit.score >= min_score:
            out.append((hit_id, hit.score))
    return out[:top_k]


def delete_vector(question_id: str) -> None:
    _client.delete(collection_name=COLLECTION, points_selector=[question_id])


# ── backward-compat aliases used by existing code ──────────────────────────────
ensure_collection_exists = ensure_collection
upsert_question_vector = upsert_vector
