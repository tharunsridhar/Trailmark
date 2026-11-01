from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (registers the tables)
from app.config import get_settings
from app.db import Base, engine
from app.routers import health


@asynccontextmanager
async def lifespan(app: FastAPI):
    # fine for the event; a real deployment would use migrations
    Base.metadata.create_all(engine)
    yield


app = FastAPI(title="Trailmark", lifespan=lifespan)

# credentials=True so the browser sends the login cookie across origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[get_settings().frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
