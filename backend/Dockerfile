FROM python:3.12-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir --default-timeout=120 --retries 5 -r requirements.txt

COPY app ./app
# results from a real run, so a deployed demo still works if the AI service is down
COPY saved_results ./saved_results

# the app writes saved analysis results here, so it must not run as root
RUN useradd --create-home appuser \
    && mkdir -p /app/saved_results \
    && chown -R appuser /app
USER appuser

EXPOSE 8000
# Render sets PORT, locally it falls back to 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
