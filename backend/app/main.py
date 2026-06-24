from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.rate_limit import limiter
from app.db.database import SessionLocal
from app.db.init_db import create_all_tables
from app.ml.qdrant_client import ensure_collection
from app.ml.topics import seed_topics
from app.auth.routes import router as auth_router
from app.questions.routes import router as questions_router
from app.analytics.routes import router as analytics_router
from app.ws.routes import router as ws_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting Gisul API…")
    create_all_tables()
    print("✓ Tables created (Supabase)")
    ensure_collection()
    print("✓ Qdrant collection ready")
    with SessionLocal() as db:
        seed_topics(db)
    print("✓ Gisul API ready — http://localhost:8000")
    yield


app = FastAPI(
    title="Gisul API",
    version="2.0.0",
    lifespan=lifespan,
)

# Rate-limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(questions_router, prefix="/questions", tags=["questions"])
app.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
app.include_router(ws_router, tags=["websocket"])


@app.get("/health")
def health_check():
    return {"status": "ok", "db": "supabase", "vectors": "qdrant"}
