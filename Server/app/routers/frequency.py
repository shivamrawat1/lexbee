from fastapi import APIRouter
from app.services.frequency import get_frequency
from app.schemas.frequency import FrequencyResponse
from fastapi import HTTPException

router = APIRouter()


@router.get("/frequency/{word}", tags=["frequency"])
async def get_frequency_route(word: str) -> FrequencyResponse:
    try:
        return await get_frequency(word)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
