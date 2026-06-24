# Gisul — Similar Question Finder

Gisul is a semantic study-history app that helps students discover patterns in their learning. Every question you ask is embedded into a 384-dimensional vector and compared against your previous questions using cosine similarity, so you instantly see what you've explored before. Questions are auto-tagged by subject area (Biology, Physics, Chemistry, Math, Computer Science, History) using nearest-centroid matching.

## What it does

- **Semantic search** over your own question history — finds conceptually similar questions even when worded differently
- **Auto-topic tagging** using pre-computed centroid vectors; no trained classifier required
- **Similarity scores** with plain-English explanations (Jaccard heuristics, zero LLM calls, zero latency)
- **Analytics dashboard** showing topic distribution, 30-day activity, and bookmark counts
- **Live progress updates** via WebSocket as each submission is processed

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Backend API | FastAPI (Python) | REST + WebSocket server |
| Database | Supabase PostgreSQL | User data, questions, metadata |
| Vector Store | Qdrant Cloud | Semantic similarity search |
| Embeddings | all-MiniLM-L6-v2 | 384-dim sentence embeddings |
| Auth | JWT + bcrypt | Secure stateless auth |
| Frontend | React + Vite + TypeScript | SPA |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| Charts | Recharts | Analytics visualisations |

## How the ML Works

**Sentence Embeddings.** Every question is converted into a 384-dimensional floating-point vector using the `all-MiniLM-L6-v2` model from Sentence Transformers. This model was chosen because it is fast, runs entirely locally (no API calls), produces high-quality semantic representations optimised for similarity tasks, and fits comfortably in memory (≈90 MB). Two questions that mean the same thing will have vectors that point in nearly the same direction, even if the words are completely different.

**Qdrant ANN Search.** Rather than comparing a new question against every existing question with sklearn (O(n) at inference time), Gisul stores all question vectors in a Qdrant collection and queries it using HNSW (Hierarchical Navigable Small World) approximate nearest-neighbour search. HNSW can return the top-k most similar vectors in O(log n) time with high recall. Cosine distance is used because it is scale-invariant — it measures the angle between vectors regardless of their magnitude, which makes it well-suited for embedding comparison.

**Nearest-Centroid Topic Tagging.** For topic assignment, a single representative centroid vector is computed for each subject by averaging the embeddings of 8 handpicked seed questions per topic. When a new question arrives, cosine similarity is computed between its embedding and each of the 6 topic centroids (all in-memory, from PostgreSQL). The topic with the highest score wins, and the score is stored as the `confidence` value. This is simpler and more explainable than a fine-tuned classifier, requires zero training data beyond the seed questions, and is trivially updated by changing the seed questions and re-seeding.

## Local Development (no Docker)

### Prerequisites
- Python 3.11+
- Node.js 20+
- A Supabase project (free tier works)
- A Qdrant Cloud cluster (free tier works)
- A HuggingFace account (free, for the embedding model token)

### Backend
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # fill in your values
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:8000
npm run dev
```

### First run
On backend startup, tables are auto-created in Supabase and topics are seeded with centroid vectors. The Qdrant collection is created if it doesn't exist. The embedding model (~90 MB) downloads on first request and is cached locally by Sentence Transformers.

## Environment Variables

| Key | Description |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string (use the pooler URL) |
| `SECRET_KEY` | JWT signing secret (generate with `python -c "import secrets; print(secrets.token_hex(32))"`) |
| `JWT_ALGORITHM` | JWT algorithm, default `HS256` |
| `JWT_EXPIRE_MINUTES` | Token expiry in minutes, default `60` |
| `QDRANT_URL` | Qdrant Cloud cluster URL |
| `QDRANT_API_KEY` | Qdrant API key from your cluster settings |
| `QDRANT_COLLECTION` | Collection name, default `gisul_questions` |
| `EMBEDDING_MODEL` | Sentence Transformers model name, default `all-MiniLM-L6-v2` |
| `HF_API_TOKEN` | HuggingFace access token (Settings → Access Tokens) |

---

## Appendix — Running Without Docker Checklist

Before the first run, verify:

- [ ] `python --version` — 3.11 or higher
- [ ] `node --version` — 20 or higher
- [ ] `.env` file exists at `backend/` with all 9 keys filled in
- [ ] Supabase project is active (check connection in Supabase dashboard)
- [ ] Qdrant cluster is running (check at your Qdrant Cloud dashboard)
- [ ] `HF_API_TOKEN` is valid (huggingface.co → Settings → Access Tokens)

**Backend startup sequence (logged to console on boot):**
```
Starting Gisul API…
✓ Tables created (Supabase)
✓ Qdrant collection ready
  Seeding topics… (first run only)
✓ Topics seeded (6 topics)
✓ Gisul API ready — http://localhost:8000
```

**Frontend:**
- `VITE_API_URL` must point to `http://localhost:8000` (or wherever the backend runs)
- `npm run dev` starts on `http://localhost:5173`