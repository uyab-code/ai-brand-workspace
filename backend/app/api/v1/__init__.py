from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.organizations import router as organizations_router
from app.api.v1.invitations import router as invitations_router
from app.api.v1.clients import router as clients_router
from app.api.v1.assets import router as assets_router
from app.api.v1.content_briefs import router as content_briefs_router
from app.api.v1.designs import router as designs_router
from app.api.v1.credits import router as credits_router
from app.api.v1.admin import router as admin_router
from app.api.v1.activities import router as activities_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(organizations_router, prefix="/organizations", tags=["Organizations"])
api_router.include_router(invitations_router, prefix="/invitations", tags=["Invitations"])
api_router.include_router(clients_router, prefix="/clients", tags=["Clients"])
api_router.include_router(assets_router, prefix="/assets", tags=["Assets"])
api_router.include_router(content_briefs_router, prefix="/content-briefs", tags=["Content Briefs"])
api_router.include_router(designs_router, prefix="/designs", tags=["Designs"])
api_router.include_router(credits_router, prefix="/credits", tags=["Credits"])
api_router.include_router(admin_router, prefix="/admin", tags=["Admin"])
api_router.include_router(activities_router, prefix="/activities", tags=["Activities"])
