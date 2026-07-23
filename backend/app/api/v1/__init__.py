from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.organizations import router as organizations_router
from app.api.v1.invitations import router as invitations_router
from app.api.v1.clients import router as clients_router
from app.api.v1.assets import router as assets_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(organizations_router, prefix="/organizations", tags=["Organizations"])
api_router.include_router(invitations_router, prefix="/invitations", tags=["Invitations"])
api_router.include_router(clients_router, prefix="/clients", tags=["Clients"])
api_router.include_router(assets_router, prefix="/assets", tags=["Assets"])
