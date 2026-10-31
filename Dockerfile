# Stage 1: Build the React pure JavaScript frontend with Vite & Tailwind CSS
FROM node:20-alpine AS frontend-builder

WORKDIR /build/frontend

COPY frontend/package.json ./package.json
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Runtime environment with Python 3.12
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

# Install backend dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source
COPY backend/app ./app

# Copy compiled static frontend assets into app/static for FastAPI SPA serving
COPY --from=frontend-builder /build/frontend/dist ./app/static

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

