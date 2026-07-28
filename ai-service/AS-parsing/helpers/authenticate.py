import os
from fastapi import Header, HTTPException
from typing import Annotated


async def authenticate_ai_service(
    authorization: Annotated[str | None, Header()] = None
):
    expected = f"Bearer {os.getenv('AS_PARSING_SECRET')}"

    if authorization != expected:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized"
        )