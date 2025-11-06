from fastapi import FastAPI
from .routers import wordnik


app = FastAPI()
app.include_router(wordnik.router)
