# main.py
from fastapi import FastAPI
from app.routers import models, conversations, chat
app = FastAPI()

app.include_router(models.router)