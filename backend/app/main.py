import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.api.v1 import api_router
from app.core.exceptions import register_exception_handlers

settings = get_settings()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        description="AI Brand Workspace for Agencies",
        version="1.0.0",
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Exception handlers
    register_exception_handlers(app)

    # Local file storage (serve uploaded assets; GCS menyusul)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

    # API routes
    app.include_router(api_router, prefix="/api/v1")

    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}

    return app


app = create_app()
