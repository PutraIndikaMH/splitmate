from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.config import settings
from app.routers import auth, users, groups, expenses, debts, settlements, friends

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="SplitMate API",
    description="Backend API untuk aplikasi manajemen patungan SplitMate",
    version="1.0.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(groups.router)
app.include_router(expenses.router)
app.include_router(debts.router)
app.include_router(settlements.router)
app.include_router(friends.router)

@app.get("/")
def root():
    return {"message": "SplitMate API is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
