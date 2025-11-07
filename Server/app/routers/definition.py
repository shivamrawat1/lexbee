from fastapi import APIRouter
from app.services.definition import extract_definition
from app.schemas.definition import DefinitionResponse
from fastapi import HTTPException

router = APIRouter()


@router.get("/definition/{word}", tags=["definition"])
async def get_definition(word: str) -> DefinitionResponse:
    try:
        return extract_definition(word)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
