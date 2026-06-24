import httpx
import numpy as np
from app.core.config import settings
import re
import time
from fastapi import HTTPException

API_URL = f"https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/{settings.EMBEDDING_MODEL}"

def _get_headers():
    token = settings.HF_API_TOKEN
    if not token:
        raise ValueError("HF_API_TOKEN is missing. Please set it in your environment variables.")
    return {"Authorization": f"Bearer {token}"}

def _normalise(text: str) -> str:
    """Strip and collapse consecutive spaces."""
    return re.sub(r"\s+", " ", text.strip())

def embed_text(text: str) -> list[float]:
    """Embed a single text string, returning a 384-dim list[float]."""
    return embed_batch([text])[0]

def embed_batch(texts: list[str]) -> list[list[float]]:
    """Single forward pass for multiple texts via HF Inference API."""
    normalised = [_normalise(t) for t in texts]
    headers = _get_headers()
    
    # Retry logic since HF API can sometimes be "loading model" or rate limit
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = httpx.post(API_URL, headers=headers, json={"inputs": normalised}, timeout=30.0)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            # If the model is currently loading, HF might return 503
            if e.response.status_code == 503 and attempt < max_retries - 1:
                time.sleep(15) # Wait for model to load
                continue
            print(f"HF API Error: {e.response.text}")
            raise HTTPException(status_code=500, detail="Error generating embeddings via Hugging Face API.")
        except Exception as e:
            print(f"Embedding error: {e}")
            if attempt < max_retries - 1:
                time.sleep(2)
                continue
            raise HTTPException(status_code=500, detail="Failed to connect to Hugging Face API.")
    
    raise HTTPException(status_code=500, detail="Failed to generate embeddings.")

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
