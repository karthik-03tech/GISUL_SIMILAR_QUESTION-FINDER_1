FROM python:3.10-slim

WORKDIR /app

# Install system dependencies if required for compiling certain wheels (like psycopg2-binary)
# note: psycopg2-binary has pre-built wheels, so python:3.10-slim should be fine.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
