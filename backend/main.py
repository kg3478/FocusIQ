"""
FocusIQ — FastAPI Application Entry Point
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os
import logging
from dotenv import load_dotenv

from database import init_db
from routes import router

load_dotenv()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("focusiq")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database and perform startup checks."""
    logger.info("Initializing database...")
    init_db()
    logger.info("✅ FocusIQ backend ready — SQLite initialized")
    
    # Startup checks
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        logger.warning("DATABASE_URL not set, defaulting to sqlite:///./focusiq.db")
        
    yield
    logger.info("Shutting down FocusIQ backend...")

app = FastAPI(
    title="FocusIQ API",
    description="AI-powered study planner backend for FocusIQ",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS — allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Error Handling Middleware
@app.middleware("http")
async def error_handling_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as exc:
        logger.error(f"Unhandled error processing request: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error. Please try again later."},
        )

# Mount all routes
app.include_router(router)

@app.get("/")
def root():
    return {"status": "ok", "app": "FocusIQ API", "version": "2.0.0"}

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "focusiq-backend",
        "environment": os.getenv("ENVIRONMENT", "development")
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
