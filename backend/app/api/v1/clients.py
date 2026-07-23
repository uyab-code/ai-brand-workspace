from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.client import ClientResponse, CreateClientRequest, UpdateClientRequest
from app.schemas.common import SuccessResponse
from app.services.client_service import ClientService

router = APIRouter()

@router.post("/", response_model=SuccessResponse[ClientResponse])
async def create_client(data: CreateClientRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return SuccessResponse(data=await ClientService(db).create_client(data, current_user.id))

@router.get("/{org_id}", response_model=SuccessResponse[List[ClientResponse]])
async def list_clients(org_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return SuccessResponse(data=await ClientService(db).list_clients(org_id, current_user.id))

@router.get("/detail/{client_id}", response_model=SuccessResponse[ClientResponse])
async def get_client(client_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return SuccessResponse(data=await ClientService(db).get_client(client_id, current_user.id))

@router.put("/{client_id}", response_model=SuccessResponse[ClientResponse])
async def update_client(client_id: UUID, data: UpdateClientRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return SuccessResponse(data=await ClientService(db).update_client(client_id, data, current_user.id))

@router.delete("/{client_id}")
async def delete_client(client_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await ClientService(db).delete_client(client_id, current_user.id)
    return SuccessResponse(data={"message": "Client deleted"})
