from httpx import AsyncClient
from urllib.parse import urlencode
from app.config import settings
from fastapi import HTTPException
from app.schemas.pronunciation import PronunciationResponse


async def extract_pronunciation(word: str) -> PronunciationResponse:
    url = f"{settings.WORDNIK_BASE_URL}word.json/{word}/audio"
    headers = {"Accept": "application/json"}
    params = {
        "api_key": settings.WORDNIK_API_KEY,
        "useCanonical": "false",
        "limit": 1,
    }
    query_string = urlencode(params)
    full_url = f"{url}?{query_string}"
    async with AsyncClient() as client:
        response = await client.get(full_url, headers=headers)
        response.raise_for_status()
        data = response.json()
        if isinstance(data, list) and data:
            # Wordnik's audio API returns a list, get first item's fileUrl if present
            file_url = data[0].get("fileUrl")
            return PronunciationResponse(fileUrl=file_url)
        raise HTTPException(status_code=500, detail="No pronunciation found")
