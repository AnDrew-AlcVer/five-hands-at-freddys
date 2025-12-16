# Imagen base de Python Slim (más grande pero sin compilación)
FROM python:3.13-slim

# Establecer el directorio de trabajo
WORKDIR /app/src

# Variables de entorno
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app/src:$PYTHONPATH

# Copiar requirements
COPY requirements.txt .

# Instalar dependencias Python (precompiladas, sin compilar)
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copiar la aplicación
COPY . . 

# Crear directorio de base de datos
RUN mkdir -p db

# Exponer puerto
EXPOSE 80

# Comando para ejecutar gunicorn en puerto 80
CMD ["python", "-m", "gunicorn", "--bind", "0.0.0.0:80", "--workers", "4", "--threads", "2", "--max-requests", "1000", "--timeout", "30", "app:app"]
