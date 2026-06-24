import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

# Determine environment file location relative to project root
current_dir = os.path.dirname(os.path.abspath(__file__))
env_file_path = os.path.abspath(os.path.join(current_dir, "..", "..", "..", ".env"))

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=env_file_path,
        env_file_encoding="utf-8",
        extra="ignore"
    )

    DATABASE_URL: str
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60
    QDRANT_URL: Optional[str] = None
    QDRANT_API_KEY: Optional[str] = None
    QDRANT_COLLECTION: str = "gisul_questions"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    HF_API_TOKEN: Optional[str] = None

    @property
    def jwt_secret_key(self) -> str:
        return self.SECRET_KEY

    def model_post_init(self, __context) -> None:
        # Pass HF_API_TOKEN to sentence-transformers/huggingface via environment if provided
        if self.HF_API_TOKEN:
            os.environ["HF_TOKEN"] = self.HF_API_TOKEN
            os.environ["HF_API_TOKEN"] = self.HF_API_TOKEN

settings = Settings()
