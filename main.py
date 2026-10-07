from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from controller import router

app = FastAPI(
    title="API Steam Analytics - CP5",
    description="API para disponibilizar dados de jogos coletados da Loja da Steam e armazenados no MongoDB.",
    version="1.0.0"
)

# Libera o acesso do Dashboard Web (HTML/JS) para consumir a API localmente
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(router)

