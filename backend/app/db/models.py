from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID, ARRAY, FLOAT as PgFloat
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    display_name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    questions = relationship("Question", back_populates="user", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="user", cascade="all, delete-orphan")


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)
    centroid = Column(ARRAY(PgFloat), nullable=True)   # 384-dim centroid vector
    color = Column(String, nullable=True)               # hex e.g. "#22c55e"

    # Relationships
    questions = relationship("Question", back_populates="topic")


class Question(Base):
    __tablename__ = "questions"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    confidence = Column(Float, nullable=True)            # cosine score of best-matching centroid
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="questions")
    topic = relationship("Topic", back_populates="questions")
    matches = relationship(
        "QuestionMatch",
        foreign_keys="[QuestionMatch.question_id]",
        back_populates="question",
        cascade="all, delete-orphan",
    )
    bookmarks = relationship("Bookmark", back_populates="question", cascade="all, delete-orphan")


class QuestionMatch(Base):
    __tablename__ = "question_matches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    matched_question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, nullable=False)
    explanation = Column(Text, nullable=True)

    # Relationships
    question = relationship("Question", foreign_keys=[question_id], back_populates="matches")
    matched_question = relationship("Question", foreign_keys=[matched_question_id])


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("user_id", "question_id", name="uq_bookmark_user_question"),)

    # Relationships
    user = relationship("User", back_populates="bookmarks")
    question = relationship("Question", back_populates="bookmarks")
