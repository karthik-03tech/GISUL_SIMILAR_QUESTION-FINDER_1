import os
import re
import numpy as np
from app.core.config import settings

# Set Hugging Face token BEFORE importing SentenceTransformer
os.environ.setdefault("HUGGINGFACE_HUB_TOKEN", settings.HF_API_TOKEN or "")

from sentence_transformers import SentenceTransformer  # noqa: E402

# Lazy-loaded model singleton
_model = None


def get_embedding_model() -> SentenceTransformer:
    global _model
    if _model is None:
        print(f"Loading SentenceTransformer model: {settings.EMBEDDING_MODEL}...")
        _model = SentenceTransformer(settings.EMBEDDING_MODEL)
        print("✓ Embedding model loaded")
    return _model


def _normalise(text: str) -> str:
    """Strip and collapse consecutive spaces."""
    return re.sub(r"\s+", " ", text.strip())


def embed_text(text: str) -> list[float]:
    """Embed a single text string, returning a 384-dim list[float]."""
    model = get_embedding_model()
    embedding = model.encode(_normalise(text))
    return embedding.tolist()


def embed_batch(texts: list[str]) -> list[list[float]]:
    """Single forward pass for multiple texts."""
    model = get_embedding_model()
    normalised = [_normalise(t) for t in texts]
    embeddings = model.encode(normalised)
    return embeddings.tolist()


def cosine_similarity_single(a: list[float], b: list[float]) -> float:
    """Pure numpy cosine similarity between two vectors. Used by topic tagging."""
    va = np.array(a, dtype=np.float32)
    vb = np.array(b, dtype=np.float32)
    norm_a = np.linalg.norm(va)
    norm_b = np.linalg.norm(vb)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(va, vb) / (norm_a * norm_b))


if __name__ == "__main__":
    v = embed_text("Why does photosynthesis need light?")
    print(f"Embedding dim: {len(v)}")   # should print 384
