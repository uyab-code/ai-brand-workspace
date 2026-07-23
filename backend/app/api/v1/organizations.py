from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.organization import (
    CreateOrganizationRequest,
    InviteMemberRequest,
    OrganizationResponse,
    TeamMemberResponse,
    UpdateMemberRoleRequest,
    UpdateOrganizationRequest,
)
from app.services.organization_service import OrganizationService

router = APIRouter()


@router.post("/", response_model=SuccessResponse[OrganizationResponse])
async def create_organization(
    data: CreateOrganizationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_service = OrganizationService(db)
    org = await org_service.create_organization(data, current_user.id)
    return SuccessResponse(data=org)


@router.get("/", response_model=SuccessResponse[List[OrganizationResponse]])
async def list_organizations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_service = OrganizationService(db)
    orgs = await org_service.get_user_organizations(current_user.id)
    return SuccessResponse(data=orgs)


@router.get("/{org_id}", response_model=SuccessResponse[OrganizationResponse])
async def get_organization(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_service = OrganizationService(db)
    org = await org_service.get_organization(org_id, current_user.id)
    return SuccessResponse(data=org)


@router.put("/{org_id}", response_model=SuccessResponse[OrganizationResponse])
async def update_organization(
    org_id: UUID,
    data: UpdateOrganizationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_service = OrganizationService(db)
    org = await org_service.update_organization(org_id, data, current_user.id)
    return SuccessResponse(data=org)


@router.post("/{org_id}/invite", response_model=SuccessResponse[TeamMemberResponse])
async def invite_member(
    org_id: UUID,
    data: InviteMemberRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_service = OrganizationService(db)
    member = await org_service.add_member(org_id, data.email, data.role, current_user.id)
    return SuccessResponse(data=member)


@router.get("/{org_id}/members", response_model=SuccessResponse[List[TeamMemberResponse]])
async def list_members(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_service = OrganizationService(db)
    members = await org_service.get_members(org_id, current_user.id)
    return SuccessResponse(data=members)


@router.put("/{org_id}/members/{member_id}", response_model=SuccessResponse[TeamMemberResponse])
async def update_member_role(
    org_id: UUID,
    member_id: UUID,
    data: UpdateMemberRoleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_service = OrganizationService(db)
    member = await org_service.update_member_role(org_id, member_id, data.role, current_user.id)
    return SuccessResponse(data=member)
