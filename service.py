import logging
import database

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)


def listar_jogos():
    return database.listar_todos_jogos()


def buscar_jogo(appid):
    return database.buscar_jogo_por_appid(appid)


def filtrar_jogos(
    termo=None,
    avaliacao=None,
    apenas_promocao=False,
    apenas_gratuitos=False,
    preco_max=None,
    ordenar_por="padrao"
):
    filtro = {}

    if avaliacao and avaliacao != "todas":
        filtro["avaliacao_resumo"] = avaliacao

    if apenas_promocao:
        filtro["em_promocao"] = True

    if apenas_gratuitos:
        filtro["gratuito"] = True

    if preco_max is not None and preco_max >= 0:
        filtro["preco_final"] = {"$lte": preco_max}

    # Define a ordenação no MongoDB (1 = crescente, -1 = decrescente)
    if ordenar_por == "menor_preco":
        ordenacao = [("preco_final", 1)]
    elif ordenar_por == "maior_preco":
        ordenacao = [("preco_final", -1)]
    elif ordenar_por == "maior_desconto":
        ordenacao = [("desconto_pct", -1)]
    elif ordenar_por == "melhor_avaliacao":
        ordenacao = [("avaliacao_positiva_pct", -1)]
    else:
        ordenacao = [("appid", 1)]

    jogos = database.buscar_jogos_com_filtro(filtro, ordenacao)

    # Filtro por termo no título (case-insensitive)
    if termo:
        termo_limpo = termo.strip().lower()
        jogos = [j for j in jogos if termo_limpo in j["titulo"].lower()]

    logging.info(
        f"Consulta no MongoDB -> Filtro: {filtro} | Termo: '{termo or ''}' | Ordenação: {ordenacao} | Retornados: {len(jogos)} jogos"
    )
    return jogos


def calcular_estatisticas():
    jogos = database.listar_todos_jogos()
    total_jogos = len(jogos)

    if total_jogos == 0:
        return {
            "total_jogos": 0,
            "jogos_gratuitos": 0,
            "jogos_em_promocao": 0,
            "preco_medio_pagos": 0.0,
            "maior_desconto_pct": 0,
            "media_aprovacao_pct": 0.0,
            "grafico_avaliacoes": [],
            "grafico_faixas_preco": []
        }

    jogos_gratuitos = database.contar_jogos({"gratuito": True})
    jogos_em_promocao = database.contar_jogos({"em_promocao": True})

    precos_pagos = [j["preco_final"] for j in jogos if j["preco_final"] > 0]
    preco_medio_pagos = round(sum(precos_pagos) / len(precos_pagos), 2) if precos_pagos else 0.0

    descontos = [j["desconto_pct"] for j in jogos]
    maior_desconto_pct = max(descontos) if descontos else 0

    avaliacoes_validas = [j["avaliacao_positiva_pct"] for j in jogos if j["avaliacao_positiva_pct"] > 0]
    media_aprovacao_pct = round(sum(avaliacoes_validas) / len(avaliacoes_validas), 1) if avaliacoes_validas else 0.0

    # Gráfico 1: Agrupamento por classificação de avaliação (usando aggregate do MongoDB)
    agregacao_avaliacoes = database.agregar_por_avaliacao()
    grafico_avaliacoes = [
        {"categoria": item["_id"] or "Sem avaliação", "quantidade": item["contagem"]}
        for item in agregacao_avaliacoes
    ]

    # Gráfico 2: Distribuição por faixa de preço (R$)
    faixas = {
        "Gratuitos (R$ 0)": 0,
        "Até R$ 50": 0,
        "R$ 50 a R$ 150": 0,
        "Acima de R$ 150": 0
    }
    for j in jogos:
        preco = j["preco_final"]
        if preco == 0:
            faixas["Gratuitos (R$ 0)"] += 1
        elif preco <= 50:
            faixas["Até R$ 50"] += 1
        elif preco <= 150:
            faixas["R$ 50 a R$ 150"] += 1
        else:
            faixas["Acima de R$ 150"] += 1

    grafico_faixas_preco = [
        {"faixa": nome_faixa, "quantidade": qtd}
        for nome_faixa, qtd in faixas.items()
    ]

    # Top 6 maiores ofertas (jogos com maior percentual de desconto)
    jogos_com_desconto = [j for j in jogos if j["desconto_pct"] > 0]
    jogos_com_desconto.sort(key=lambda x: x["desconto_pct"], reverse=True)
    top_ofertas = jogos_com_desconto[:6]

    return {
        "total_jogos": total_jogos,
        "jogos_gratuitos": jogos_gratuitos,
        "jogos_em_promocao": jogos_em_promocao,
        "preco_medio_pagos": preco_medio_pagos,
        "maior_desconto_pct": maior_desconto_pct,
        "media_aprovacao_pct": media_aprovacao_pct,
        "grafico_avaliacoes": grafico_avaliacoes,
        "grafico_faixas_preco": grafico_faixas_preco,
        "top_ofertas": top_ofertas
    }

