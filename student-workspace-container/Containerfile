FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    STUDENT_WORKSPACE_DATA_DIR=/data

WORKDIR /app

RUN groupadd --gid 10001 workspace \
    && useradd --uid 10001 --gid workspace --no-create-home --shell /usr/sbin/nologin workspace \
    && mkdir -p /data \
    && chown workspace:workspace /data

COPY requirements.txt .
RUN pip install --no-cache-dir --requirement requirements.txt

COPY --chown=workspace:workspace app.py .
COPY --chown=workspace:workspace static ./static
COPY --chown=workspace:workspace templates ./templates

USER 10001:10001

EXPOSE 5002

CMD ["gunicorn", "--bind=0.0.0.0:5002", "--workers=2", "--threads=4", "--timeout=30", "--access-logfile=-", "--error-logfile=-", "app:create_app()"]
