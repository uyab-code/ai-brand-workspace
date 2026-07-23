from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException, ForbiddenException
from app.core.permissions import Role, has_permission
from app.models.client import Client
from app.models.organization import TeamMember
from app.models.user import User
from app.schemas.client import ClientResponse, CreateClientRequest, UpdateClientRequest


class ClientService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_client(self, data: CreateClientRequest, user_id: UUID) -> ClientResponse:
        org_id = UUID(data.organization_id)
        await self._check_permission(org_id, user_id, "create_client")
        client = Client(organization_id=org_id, name=data.name, description=data.description, status=data.status)
        self.db.add(client)
        await self.db.commit()
        await self.db.refresh(client)
        return ClientResponse(id=str(client.id), organization_id=str(client.organization_id), name=client.name, description=client.description, status=client.status)

    async def list_clients(self, org_id: UUID, user_id: UUID) -> List[ClientResponse]:
        await self._check_membership(org_id, user_id)
        result = await self.db.execute(select(Client).where(Client.organization_id == org_id))
        return [ClientResponse(id=str(c.id), organization_id=str(c.organization_id), name=c.name, description=c.description, status=c.status) for c in result.scalars().all()]

    async def get_client(self, client_id: UUID, user_id: UUID) -> ClientResponse:
        client = await self._get_client(client_id)
        await self._check_membership(client.organization_id, user_id)
        return ClientResponse(id=str(client.id), organization_id=str(client.organization_id), name=client.name, description=client.description, status=client.status)

    async def update_client(self, client_id: UUID, data: UpdateClientRequest, user_id: UUID) -> ClientResponse:
        client = await self._get_client(client_id)
        await self._check_permission(client.organization_id, user_id, "update_client")
        if data.name is not None: client.name = data.name
        if data.description is not None: client.description = data.description
        if data.status is not None: client.status = data.status
        await self.db.commit()
        await self.db.refresh(client)
        return ClientResponse(id=str(client.id), organization_id=str(client.organization_id), name=client.name, description=client.description, status=client.status)

    async def delete_client(self, client_id: UUID, user_id: UUID):
        client = await self._get_client(client_id)
        await self._check_permission(client.organization_id, user_id, "delete_client")
        await self.db.delete(client)
        await self.db.commit()

    async def _get_client(self, client_id: UUID) -> Client:
        result = await self.db.execute(select(Client).where(Client.id == client_id))
        c = result.scalar_one_or_none()
        if not c: raise NotFoundException("Client", str(client_id))
        return c

    async def _check_membership(self, org_id: UUID, user_id: UUID):
        result = await self.db.execute(select(TeamMember).where(TeamMember.organization_id == org_id, TeamMember.user_id == user_id))
        m = result.scalar_one_or_none()
        if not m:
            u = (await self.db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
            if u and u.is_superuser:
                class V: role = Role.ADMIN.value
                return V()
            raise ForbiddenException("Not a member of this organization")
        return m

    async def _check_permission(self, org_id: UUID, user_id: UUID, permission: str):
        m = await self._check_membership(org_id, user_id)
        u = (await self.db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
        if not has_permission(Role(m.role), permission, u.is_superuser if u else False):
            raise ForbiddenException(f"Insufficient permissions: {permission}")
