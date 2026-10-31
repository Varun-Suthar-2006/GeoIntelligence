import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import settings

logger = logging.getLogger("geointelligence.database")

# Handle SQLite vs PostgreSQL arguments
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args=connect_args,
        echo=False,
        future=True
    )
    # Test connection
    with engine.connect() as conn:
        logger.info(f"Database connection established successfully with {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
except Exception as e:
    logger.warning(f"Failed to connect using DATABASE_URL: {e}. Falling back to local SQLite database.")
    fallback_url = f"sqlite:///{settings.DATA_PATH / 'geointelligence.db'}"
    engine = create_engine(
        fallback_url,
        connect_args={"check_same_thread": False},
        future=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    # Import all models to ensure they register on Base.metadata
    from backend.app.models import (
        user, dataset, image, ai_model, analysis, report
    )
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
