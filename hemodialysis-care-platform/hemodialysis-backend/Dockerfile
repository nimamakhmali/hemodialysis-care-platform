FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

WORKDIR /app

# Install system dependencies
#RUN apt-get update && apt-get install -y --no-install-recommends \
#    gcc \
#    g++ \
#    libpq-dev \
#    && rm -rf /var/lib/apt/lists/*
#
# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    --index-url https://mirror-pypi.runflare.com/simple/ \
    --trusted-host mirror-pypi.runflare.com \
    -r requirements.txt
    
# Copy application code
COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Run Alembic migrations before starting the server
CMD ["python", "scripts/entrypoint.py", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]