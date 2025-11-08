from fastapi import APIRouter
from app.services.pronunciation import extract_pronunciation
from app.schemas.pronunciation import PronunciationResponse
from fastapi import HTTPException

router = APIRouter()


@router.get("/pronunciation/{word}", tags=["pronunciation"])
async def get_pronunciation(word: str) -> PronunciationResponse:
    try:
        return await extract_pronunciation(word)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
