import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select
from app.config import get_settings
from app.models.user import User
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
            # Update existing user to superadmin
            existing_user.is_superuser = True
            existing_user.name = "Super Admin"
            await db.commit()
            print("=" * 50)
            print("User updated to Superadmin!")
            print("=" * 50)
            print(f"Email: yabo@gmail.com")
            print(f"Is Superuser: True")
            print("=" * 50)
            await engine.dispose()
            return

        # Create superadmin user
        user = User(
            email="yabo@gmail.com",
            password_hash=hash_password("yaboyabo"),
            name="Super Admin",
            is_superuser=True,
        )
        db.add(user)
        await db.commit()

        print("=" * 50)
        print("Superadmin account created successfully!")
        print("=" * 50)
        print(f"Email: yabo@gmail.com")
        print(f"Password: yaboyabo")
        print(f"Is Superuser: True")
        print("=" * 50)

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(create_superadmin())
