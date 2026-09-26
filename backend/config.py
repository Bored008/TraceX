import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    CORS_ORIGINS: list[str] = [
        origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,*").split(",")
    ]
    
    # Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    
    # Anomaly Detection Thresholds
    Z_LATENCY_THRESHOLD: float = float(os.getenv("Z_LATENCY_THRESHOLD", "3.0"))
    Z_ERROR_THRESHOLD: float = float(os.getenv("Z_ERROR_THRESHOLD", "2.5"))
    Z_RPS_THRESHOLD: float = float(os.getenv("Z_RPS_THRESHOLD", "-2.5"))
    ERROR_MULTIPLIER_THRESHOLD: float = float(os.getenv("ERROR_MULTIPLIER_THRESHOLD", "5.0"))
    
    # Sliding Windows & Buffer
    ROLLING_WINDOW_SECONDS: int = int(os.getenv("ROLLING_WINDOW_SECONDS", "60"))
    EVENT_BUFFER_SECONDS: float = float(os.getenv("EVENT_BUFFER_SECONDS", "5.0"))
    SIMULATOR_TICK_SECONDS: float = float(os.getenv("SIMULATOR_TICK_SECONDS", "1.0"))
    
    # Impact calculations
    BASE_USER_MULTIPLIER: int = 15

settings = Settings()
