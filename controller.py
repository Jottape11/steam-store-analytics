from typing import Optional
from fastapi import APIRouter, HTTPException
import service
import crawler

router = APIRouter(prefix="/jogos", tags=["Jogos da Steam"])


@router.get("")
def listar_jogos():
    """Lista todos os jogos armazenados no MongoDB."""
    return service.listar_jogos()


@router.get("/busca")
def filtrar_jogos(
    termo: Optional[str] = None,
    avaliacao: Optional[str] = None,
    apenas_promocao: bool = False,
    apenas_gratuitos: bool = False,
    preco_max: Optional[float] = None,
    ordenar_por: str = "padrao"
):
    """Realiza filtro e busca sobre os jogos coletados."""
    return service.filtrar_jogos(
        termo=termo,
        avaliacao=avaliacao,
        apenas_promocao=apenas_promocao,
        apenas_gratuitos=apenas_gratuitos,
        preco_max=preco_max,
        ordenar_por=ordenar_por
    )


@router.get("/estatisticas")
def obter_estatisticas():
    """Retorna indicadores e agregações para alimentar os gráficos do dashboard."""
    return service.calcular_estatisticas()


@router.post("/coletar")
def disparar_nova_coleta(paginas: int = 6):
    """Permite disparar uma nova coleta sem apagar os registros anteriores."""
    crawler.executar_crawler(total_paginas=paginas)
    return {"mensagem": f"Coleta de {paginas} página(s) concluída com sucesso!"}


@router.get("/{appid}")
def buscar_jogo_especifico(appid: int):
    """Consulta um registro específico pelo AppID da Steam."""
    jogo = service.buscar_jogo(appid)
    if jogo is None:
        raise HTTPException(status_code=404, detail="Jogo não encontrado no banco de dados")
    return jogo

