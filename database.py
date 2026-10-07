import os
from pymongo import MongoClient


def carregar_mongo_uri():
    caminho_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.exists(caminho_env):
        with open(caminho_env, "r", encoding="utf-8") as arquivo:
            for linha in arquivo:
                if linha.strip().startswith("MONGO_URI="):
                    return linha.strip().split("MONGO_URI=", 1)[1]
    return "mongodb://localhost:27017/"


# Conexão com o MongoDB (padrão PyMongo visto na aula 09)
MONGO_URI = carregar_mongo_uri()
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=15000)
db = client["steam_db"]
colecao = db["jogos"]


def configurar_indices():
    colecao.create_index("appid")
    colecao.create_index("preco_final")


def salvar_ou_atualizar_jogo(documento):
    existente = colecao.find_one({"appid": documento["appid"]})

    if existente is None:
        colecao.insert_one(documento)
        return "inserido"
    else:
        colecao.update_one(
            {"appid": documento["appid"]},
            {"$set": documento}
        )
        return "atualizado"


def listar_todos_jogos():
    projecao = {"_id": 0}
    resultados = colecao.find({}, projection=projecao).sort([("data_coleta", -1)])
    return list(resultados)


def buscar_jogo_por_appid(appid):
    projecao = {"_id": 0}
    return colecao.find_one({"appid": appid}, projection=projecao)


def buscar_jogos_com_filtro(filtro, ordenacao):
    projecao = {"_id": 0}
    resultados = colecao.find(filtro, projection=projecao).sort(ordenacao)
    return list(resultados)


def contar_jogos(filtro=None):
    if filtro is None:
        filtro = {}
    return colecao.count_documents(filtro)


def agregar_por_avaliacao():
    pipeline = [
        {"$group": {"_id": "$avaliacao_resumo", "contagem": {"$sum": 1}}},
        {"$sort": {"contagem": -1}}
    ]
    return list(colecao.aggregate(pipeline))
