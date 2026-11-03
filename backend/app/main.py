from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (registers the tables)
from app.config import check_settings, get_settings
from app.db import Base, engine
from app.routers import analysis, auth, handovers, health, questions, review, sources, view


@asynccontextmanager
async def lifespan(app: FastAPI):
    check_settings(get_settings())
    # fine for the event; a real deployment would use migrations
    Base.metadata.create_all(engine)
    yield


app = FastAPI(title="Trailmark", lifespan=lifespan)

settings = get_settings()
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
]
if settings.frontend_origin:
    for o in settings.frontend_origin.split(","):
        o = o.strip()
        if o and o not in allowed_origins:
            allowed_origins.append(o)

# credentials=True so the browser sends the login cookie across origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(handovers.router)
app.include_router(sources.router)
app.include_router(sources.pieces_router)
app.include_router(analysis.router)
app.include_router(questions.router)
app.include_router(review.router)
app.include_router(view.router)
