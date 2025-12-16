FROM python:3.13-slim
WORKDIR /app/src

# Variables de entorno
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app/src:$PYTHONPATH
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

COPY . . 

RUN mkdir -p db

EXPOSE 80

CMD ["python", "-m", "gunicorn", "--bind", "0.0.0.0:80", "--workers", "4", "--threads", "2", "--max-requests", "1000", "--timeout", "30", "app:app"]
