FROM python:3.11-slim

# Install system geospatial libraries: GDAL, PROJ, GEOS, and OpenCV dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gdal-bin \
    libgdal-dev \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install Python dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy source code and data
COPY backend /app/backend
COPY models /app/models
COPY data /app/data

ENV PYTHONPATH=/app
ENV PORT=8000

EXPOSE 8000

CMD ["python", "backend/run.py"]
