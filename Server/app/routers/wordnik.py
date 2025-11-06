from fastapi import APIRouter, HTTPException, Query
from app.config import settings
from httpx import AsyncClient, Response
from typing import Optional, List
from urllib.parse import urlencode
from app.schemas.wordnik import WordnikDefinitionResponse

router = APIRouter()


@router.get("/front/{word}", tags=["front"])
async def get_word_definitions(
    word: str,
    limit: int = Query(default=3, description="Maximum number of results to return"),
    partOfSpeech: Optional[str] = Query(
        default=None, description="CSV list of part-of-speech types"
    ),
    includeRelated: str = Query(
        default="false", description="Return related words with definitions"
    ),
    sourceDictionaries: Optional[List[str]] = Query(
        default=None, description="Source dictionary to return definitions from"
    ),
    useCanonical: str = Query(
        default="false", description="If true will try to return the correct word root"
    ),
    includeTags: str = Query(
        default="false", description="Return a closed set of XML tags in response"
    ),
) -> List[WordnikDefinitionResponse]:
    # Build query parameters
    params = {
        "limit": limit,
        "includeRelated": includeRelated,
        "useCanonical": useCanonical,
        "includeTags": includeTags,
        "api_key": settings.WORDNIK_API_KEY,
    }

    # Add optional parameters
    if partOfSpeech:
        params["partOfSpeech"] = partOfSpeech

    if sourceDictionaries:
        # Handle array parameter - Wordnik API expects comma-separated values
        params["sourceDictionaries"] = ",".join(sourceDictionaries)
    else:
        params["sourceDictionaries"] = "all"

    # Build the API URL
    url = f"{settings.WORDNIK_BASE_URL}word.json/{word}/definitions"
    query_string = urlencode(params)
    full_url = f"{url}?{query_string}"

    headers = {"Accept": "application/json"}
    async with AsyncClient() as client:
        try:
            response: Response = await client.get(full_url, headers=headers)
            response.raise_for_status()
            data = response.json()
            # Wordnik API returns a list of definitions
            return [WordnikDefinitionResponse(**item) for item in data]
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
