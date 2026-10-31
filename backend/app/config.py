import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"

class Settings(BaseSettings):
    PROJECT_NAME: str = "GeoIntelligence AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Storage paths
    DATA_PATH: Path = DATA_DIR
    RAW_DIR: Path = DATA_DIR / "raw"
    PROCESSED_DIR: Path = DATA_DIR / "processed"
    MASKS_DIR: Path = DATA_DIR / "masks"
    WEIGHTS_DIR: Path = DATA_DIR / "weights"
    REPORTS_DIR: Path = DATA_DIR / "reports"
    SAMPLES_DIR: Path = DATA_DIR / "samples"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{DATA_DIR / 'geointelligence.db'}"
    )
    
    # Model inference settings
    DEFAULT_CHANGE_THRESHOLD: float = 0.5
    DEFAULT_MIN_AREA_M2: float = 200.0  # Minimum mapping unit to eliminate single-pixel noise
    
    model_config = {"env_file": ".env", "extra": "allow"}

settings = Settings()

# Ensure directories exist
for p in [
    settings.RAW_DIR,
    settings.PROCESSED_DIR,
    settings.MASKS_DIR,
    settings.WEIGHTS_DIR,
    settings.REPORTS_DIR,
    settings.SAMPLES_DIR
]:
    p.mkdir(parents=True, exist_ok=True)
