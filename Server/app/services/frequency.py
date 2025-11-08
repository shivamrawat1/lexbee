from httpx import AsyncClient, Response
from app.config import settings
from app.schemas.frequency import FrequencyResponse
from typing import Optional
from urllib.parse import urlencode


async def extract_frequency(
    word: str,
    useCanonical: str = "false",
    startYear: Optional[int] = None,
    endYear: Optional[int] = None,
) -> FrequencyResponse:
    url = f"{settings.WORDNIK_BASE_URL}word.json/{word}/frequency"
    headers = {"Accept": "application/json"}

    params = {
        "api_key": settings.WORDNIK_API_KEY,
        "useCanonical": useCanonical,
    }

    if startYear is not None:
        params["startYear"] = startYear
    if endYear is not None:
        params["endYear"] = endYear

    query_string = urlencode(params)
    full_url = f"{url}?{query_string}"

    async with AsyncClient() as client:
        response: Response = await client.get(full_url, headers=headers)
        response.raise_for_status()
        data = response.json()
        year_counts = {
            entry["year"]: entry["count"] for entry in data.get("frequency", [])
        }
        return FrequencyResponse(frequencies=year_counts)
