-- SQL DDL schema for Similar Question Finder

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create topics table
CREATE TABLE IF NOT EXISTS topics (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    centroid DOUBLE PRECISION[] -- avg embedding of seed examples, dim 384
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    embedding DOUBLE PRECISION[], -- dim 384
    topic_id INT REFERENCES topics(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create question_matches table
CREATE TABLE IF NOT EXISTS question_matches (
    id SERIAL PRIMARY KEY,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    matched_question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    score DOUBLE PRECISION NOT NULL -- cosine similarity, 0-1
);
