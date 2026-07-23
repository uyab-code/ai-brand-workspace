import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select
from app.config import get_settings
from app.models.user import User
from app.models.organization import Organization, TeamMember
from app.core.security import hash_password

settings = get_settings()


async def create_superadmin():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        # Check if user exists
        result = await db.execute(select(User).where(User.email == "yabo@gmail.com"))
        existing_user = result.scalar_one_or_none()

        if existing_user:
            print("User already exists!")
            return

        # Create user
        user = User(
            email="yabo@gmail.com",
            password_hash=hash_password("yaboyabo"),
            name="Super Admin",
        )
        db.add(user)
        await db.flush()

        # Create organization
        org = Organization(
            name="AI Brand Workspace",
            owner_id=user.id,
        )
        db.add(org)
        await db.flush()

        # Add user as owner
        team_member = TeamMember(
            organization_id=org.id,
            user_id=user.id,
            role="owner",
        )
        db.add(team_member)

        await db.commit()

        print("=" * 50)
        print("Superadmin account created successfully!")
        print("=" * 50)
        print(f"Email: yabo@gmail.com")
        print(f"Password: yaboyabo")
        print(f"Organization: AI Brand Workspace")
        print(f"Role: owner")
        print("=" * 50)

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(create_superadmin())
