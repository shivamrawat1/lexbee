from fastapi import FastAPI
from .routers import wordnik


app = FastAPI()


@app.get("/")
async def health_check():
    return {"message": "OK"}


app.include_router(wordnik.router)
