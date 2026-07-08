# main.py
from fastapi import FastAPI
from app.routers import models, conversations, chat, health
app = FastAPI()

app.include_router(models.router)
app.include_router(conversations.router)
app.include_router(chat.router)
app.include_router(health.router)