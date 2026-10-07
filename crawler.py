import logging
from datetime import datetime
import requests
from bs4 import BeautifulSoup
import database

# Configurando o logger conforme visto na aula de Logs
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

URL_BASE_STEAM = "https://store.steampowered.com/search/"


def limpar_preco_brl(texto_preco):
    if not texto_preco:
        return 0.0
    texto = texto_preco.strip().lower()
    if "gr" in texto or "free" in texto:
        return 0.0
    texto_limpo = texto.replace("r$", "").replace(".", "").replace(",", ".").strip()
    try:
        return round(float(texto_limpo), 2)
    except ValueError:
        return 0.0


def extrair_avaliacao(linha_html):
    span_review = linha_html.select_one("span.search_review_summary")
    if not span_review:
        return "Sem avaliação", 0

    tooltip = span_review.get("data-tooltip-html", "")
    partes = tooltip.split("<br>")
    resumo = partes[0].strip() if partes else "Sem avaliação"

    percentual = 0
    if len(partes) > 1 and "%" in partes[1]:
        texto_pct = partes[1].split("%")[0].strip()
        if texto_pct.isdigit():
            percentual = int(texto_pct)

    return resumo, percentual


def extrair_plataformas(linha_html):
    plataformas = []
    if linha_html.select_one("span.platform_img.win"):
        plataformas.append("Windows")
    if linha_html.select_one("span.platform_img.mac"):
        plataformas.append("Mac")
    if linha_html.select_one("span.platform_img.linux"):
        plataformas.append("Linux")
    return plataformas


def coletar_pagina_steam(pagina=1):
    parametros = {
        "filter": "topsellers",
        "cc": "br",
        "l": "portuguese",
        "page": pagina
    }

    logging.info(f"Acessando página {pagina} da Steam...")
    resposta = requests.get(URL_BASE_STEAM, params=parametros, timeout=15)

    soup = BeautifulSoup(resposta.text, "html.parser")
    linhas = soup.select("a.search_result_row")
    jogos_extraidos = []

    for linha in linhas:
        try:
            appid_str = linha.get("data-ds-appid")
            if not appid_str:
                continue
            appid = int(appid_str.split(",")[0])

            elem_titulo = linha.select_one("span.title")
            titulo = elem_titulo.text.strip() if elem_titulo else "Sem título"

            elem_data = linha.select_one("div.search_released")
            data_lancamento = elem_data.text.strip() if elem_data and elem_data.text.strip() else "Não informada"

            bloco_desconto = linha.select_one("div.search_discount_block")
            desconto_pct = 0
            if bloco_desconto and bloco_desconto.get("data-discount"):
                desconto_pct = int(bloco_desconto.get("data-discount", 0))

            elem_preco_final = linha.select_one("div.discount_final_price")
            preco_final = limpar_preco_brl(elem_preco_final.text if elem_preco_final else "")

            elem_preco_orig = linha.select_one("div.discount_original_price")
            preco_original = limpar_preco_brl(elem_preco_orig.text) if elem_preco_orig else preco_final

            avaliacao_resumo, avaliacao_pct = extrair_avaliacao(linha)
            plataformas = extrair_plataformas(linha)

            elem_img = linha.select_one("div.search_capsule img")
            imagem = elem_img.get("src", "") if elem_img else ""

            url_bruta = linha.get("href", "")
            url_origem = url_bruta.split("?")[0] if url_bruta else URL_BASE_STEAM

            jogo = {
                "appid": appid,
                "titulo": titulo,
                "data_lancamento": data_lancamento,
                "preco_original": preco_original,
                "preco_final": preco_final,
                "desconto_pct": desconto_pct,
                "gratuito": (preco_final == 0.0),
                "em_promocao": (desconto_pct > 0),
                "avaliacao_resumo": avaliacao_resumo,
                "avaliacao_positiva_pct": avaliacao_pct,
                "plataformas": plataformas,
                "imagem": imagem,
                "url_origem": url_origem,
                "fonte": "Steam Store Brasil",
                "data_coleta": datetime.now().strftime("%d/%m/%Y %H:%M:%S")
            }
            jogos_extraidos.append(jogo)

        except Exception as erro_item:
            logging.warning(f"Erro ao processar item da página {pagina}: {erro_item}")

    return jogos_extraidos


def executar_crawler(total_paginas=6):
    logging.info("Iniciando o Web Crawler da Loja da Steam...")
    inseridos = 0
    atualizados = 0

    try:
        database.configurar_indices()

        for pagina in range(1, total_paginas + 1):
            jogos = coletar_pagina_steam(pagina)
            logging.info(f"Página {pagina}: {len(jogos)} jogos identificados.")

            for jogo in jogos:
                status = database.salvar_ou_atualizar_jogo(jogo)
                if status == "inserido":
                    inseridos += 1
                else:
                    atualizados += 1

        logging.info(f"Coleta finalizada! Novos inseridos: {inseridos} | Atualizados: {atualizados}")

    except Exception as e:
        logging.error(f"Falha durante a execução do crawler: {e}")
    finally:
        logging.info("Encerrando execução do Web Crawler.")


if __name__ == "__main__":
    executar_crawler(total_paginas=6)
