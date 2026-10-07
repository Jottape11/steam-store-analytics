const URL_API = "http://localhost:8000/jogos";

// Ícones SVG limpos (padrão Reicon)
const ICONE_WINDOWS = `
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 5.557L10.35 4.5v7.05H3V5.557zm0 12.886L10.35 19.5v-7.05H3v6.007zm8.25 1.182L21 21v-8.55h-9.75v7.175zm0-15.25V11.55H21V3l-9.75 1.375z"/>
  </svg>
`;

const ICONE_LINK_EXTERNO = `
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
`;

const ICONE_RELOGIO = `
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
`;

const CORES_GRAFICO = ["#66c0f4", "#a4d007", "#f59e0b", "#38bdf8", "#94a3b8", "#f87171"];

const mostrarMensagem = (texto) => {
  const alerta = document.querySelector("#alerta-status");
  alerta.textContent = texto;
  alerta.classList.remove("hidden");
};

// =========================================================================
// NAVEGAÇÃO ENTRE PÁGINAS PELO HEADER ("Loja & Catálogo" vs "Análise & Estatísticas")
// =========================================================================
const paginaLoja = document.querySelector("#pagina-loja");
const paginaEstatisticas = document.querySelector("#pagina-estatisticas");
const navBtnLoja = document.querySelector("#nav-btn-loja");
const navBtnEstatisticas = document.querySelector("#nav-btn-estatisticas");
const btnVoltarLoja = document.querySelector("#btn-voltar-loja");

const abrirPaginaLoja = () => {
  paginaLoja.classList.remove("hidden");
  paginaEstatisticas.classList.add("hidden");
  navBtnLoja.className = "flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded bg-[#66c0f4] text-[#171a21] transition cursor-pointer";
  navBtnEstatisticas.className = "flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded text-[#c7d5e0] hover:text-white transition cursor-pointer";
};

const abrirPaginaEstatisticas = () => {
  paginaLoja.classList.add("hidden");
  paginaEstatisticas.classList.remove("hidden");
  navBtnEstatisticas.className = "flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded bg-[#66c0f4] text-[#171a21] transition cursor-pointer";
  navBtnLoja.className = "flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded text-[#c7d5e0] hover:text-white transition cursor-pointer";
};

navBtnLoja.addEventListener("click", abrirPaginaLoja);
navBtnEstatisticas.addEventListener("click", abrirPaginaEstatisticas);
btnVoltarLoja.addEventListener("click", abrirPaginaLoja);

// =========================================================================
// 1. ESTATÍSTICAS E GRÁFICOS (Página de Análise & Estatísticas)
// =========================================================================
const carregarEstatisticas = async () => {
  try {
    const resposta = await fetch(`${URL_API}/estatisticas`);
    const stats = await resposta.json();

    document.querySelector("#kpi-total").textContent = stats.total_jogos;
    document.querySelector("#kpi-gratuitos").textContent = `${stats.jogos_gratuitos} títulos gratuitos (F2P)`;
    document.querySelector("#kpi-preco-medio").textContent = `R$ ${stats.preco_medio_pagos.toFixed(2).replace(".", ",")}`;
    document.querySelector("#kpi-promocao").textContent = stats.jogos_em_promocao;
    document.querySelector("#kpi-maior-desconto").textContent = `Maior desconto: -${stats.maior_desconto_pct}%`;
    document.querySelector("#kpi-aprovacao").textContent = `${stats.media_aprovacao_pct}%`;

    renderizarGraficoDonutAvaliacoes(stats.grafico_avaliacoes, stats.total_jogos);
    renderizarGraficoColunasPreco(stats.grafico_faixas_preco, stats.total_jogos);
    renderizarRankingOfertas(stats.top_ofertas || []);
  } catch (erro) {
    mostrarMensagem("Não foi possível conectar na API FastAPI em http://localhost:8000. Verifique se o uvicorn está ativo.");
  }
};

// Gráfico 1: Rosca SVG (Donut Chart) + Legenda de Avaliações
const renderizarGraficoDonutAvaliacoes = (listaAvaliacoes, total) => {
  const container = document.querySelector("#grafico-avaliacoes");
  const svgDonut = document.querySelector("#donut-svg");
  const donutTotal = document.querySelector("#donut-total");

  container.innerHTML = "";
  svgDonut.innerHTML = `
    <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="#101822" stroke-width="5"></circle>
  `;
  donutTotal.textContent = total;

  if (!listaAvaliacoes || listaAvaliacoes.length === 0) {
    container.innerHTML = `<p class="text-sm text-[#8f98a0]">Nenhum dado coletado ainda.</p>`;
    return;
  }

  let offsetAcumulado = 0;

  listaAvaliacoes.forEach((item, index) => {
    const cor = CORES_GRAFICO[index % CORES_GRAFICO.length];
    const percentualExato = total > 0 ? (item.quantidade / total) * 100 : 0;
    const percentualArredondado = Math.round(percentualExato);

    // Segmento do anel SVG (circunferência = 100 para r = 15.9155)
    if (percentualExato > 0) {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", "21");
      circle.setAttribute("cy", "21");
      circle.setAttribute("r", "15.9155");
      circle.setAttribute("fill", "transparent");
      circle.setAttribute("stroke", cor);
      circle.setAttribute("stroke-width", "5");
      circle.setAttribute("stroke-dasharray", `${percentualExato} ${100 - percentualExato}`);
      circle.setAttribute("stroke-dashoffset", `${-offsetAcumulado}`);
      svgDonut.appendChild(circle);
      offsetAcumulado += percentualExato;
    }

    // Item da legenda ao lado da rosca
    const itemLegenda = document.createElement("div");
    itemLegenda.innerHTML = `
      <div class="flex items-center justify-between text-xs mb-1">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-sm inline-block" style="background-color: ${cor}"></span>
          <span class="font-medium text-white">${item.categoria}</span>
        </div>
        <span class="text-[#c7d5e0] font-semibold">${item.quantidade} <span class="text-[#8f98a0] font-normal">(${percentualArredondado}%)</span></span>
      </div>
      <div class="w-full bg-[#101822] rounded h-2 overflow-hidden">
        <div class="h-full rounded" style="width: ${percentualArredondado}%; background-color: ${cor}"></div>
      </div>
    `;
    container.append(itemLegenda);
  });
};

// Gráfico 2: Colunas Verticais (Faixas de Preço em R$)
const renderizarGraficoColunasPreco = (listaFaixas, total) => {
  const container = document.querySelector("#grafico-faixas-preco");
  container.innerHTML = "";

  if (!listaFaixas || listaFaixas.length === 0) {
    container.innerHTML = `<p class="col-span-4 text-sm text-center text-[#8f98a0]">Nenhum dado coletado ainda.</p>`;
    return;
  }

  const maiorQtd = Math.max(...listaFaixas.map((f) => f.quantidade), 1);
  const coresColunas = ["#66c0f4", "#38bdf8", "#a4d007", "#f59e0b"];

  listaFaixas.forEach((item, index) => {
    const percentualTotal = total > 0 ? Math.round((item.quantidade / total) * 100) : 0;
    const alturaColunaPct = Math.max(Math.round((item.quantidade / maiorQtd) * 100), 6);
    const cor = coresColunas[index % coresColunas.length];

    const coluna = document.createElement("div");
    coluna.className = "flex flex-col items-center justify-end h-full";
    coluna.innerHTML = `
      <div class="flex flex-col items-center justify-end w-full flex-1">
        <span class="text-xs font-bold text-white mb-1">${item.quantidade}</span>
        <span class="text-[10px] text-[#8f98a0] mb-1.5">${percentualTotal}%</span>
        <div
          class="w-full max-w-[68px] rounded-t transition-all duration-300 border-t border-x border-white/20"
          style="height: ${alturaColunaPct}%; background-color: ${cor}"
        ></div>
      </div>
      <p class="text-[11px] font-medium text-[#c7d5e0] text-center mt-2.5 leading-tight h-7 flex items-center justify-center">
        ${item.faixa}
      </p>
    `;
    container.append(coluna);
  });
};

// Ranking Visual: Top 6 Maiores Descontos
const renderizarRankingOfertas = (topOfertas) => {
  const container = document.querySelector("#ranking-ofertas");
  container.innerHTML = "";

  if (!topOfertas || topOfertas.length === 0) {
    container.innerHTML = `<p class="text-sm text-[#8f98a0]">Nenhuma oferta ativa encontrada.</p>`;
    return;
  }

  topOfertas.forEach((jogo) => {
    const bannerHd = `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${jogo.appid}/header.jpg`;
    const card = document.createElement("a");
    card.href = jogo.url_origem;
    card.target = "_blank";
    card.className = "flex items-center gap-3 bg-[#101822] border border-[#2a475e]/60 hover:border-[#66c0f4] rounded p-2.5 transition";

    card.innerHTML = `
      <img
        src="${bannerHd}"
        onerror="this.onerror=null; this.src='${jogo.imagem}';"
        alt="${jogo.titulo}"
        class="w-24 h-12 object-cover rounded shrink-0"
      />
      <div class="flex-1 min-w-0">
        <p class="text-xs font-bold text-white truncate">${jogo.titulo}</p>
        <p class="text-[11px] text-[#8f98a0]">De <span class="line-through">R$ ${jogo.preco_original.toFixed(2).replace(".", ",")}</span> por <span class="text-[#beee11] font-semibold">R$ ${jogo.preco_final.toFixed(2).replace(".", ",")}</span></p>
      </div>
      <span class="bg-[#4c6b22] text-[#beee11] text-xs font-bold px-2 py-1 rounded shrink-0">
        -${jogo.desconto_pct}%
      </span>
    `;
    container.append(card);
  });
};

// =========================================================================
// 2. BUSCA E RENDERIZAÇÃO DA LOJA (Cards e Tabela)
// =========================================================================
const buscarJogos = async () => {
  try {
    const termo = document.querySelector("#filtro-termo").value.trim();
    const precoMax = document.querySelector("#filtro-preco-max").value;
    const ordenacao = document.querySelector("#filtro-ordenacao").value;
    const apenasPromocao = document.querySelector("#filtro-promocao").checked;

    const params = new URLSearchParams();
    if (termo) params.append("termo", termo);
    if (precoMax) params.append("preco_max", precoMax);
    if (ordenacao) params.append("ordenar_por", ordenacao);
    if (apenasPromocao) params.append("apenas_promocao", "true");

    const resposta = await fetch(`${URL_API}/busca?${params.toString()}`);
    const dados = await resposta.json();

    renderizarCardsLoja(dados);
    renderizarTabelaJogos(dados);
  } catch (erro) {
    mostrarMensagem("Erro ao carregar os jogos da API.");
  }
};

const renderizarCardsLoja = (listaJogos) => {
  const grid = document.querySelector("#grid-jogos");
  const contador = document.querySelector("#contador-listagem");
  grid.innerHTML = "";
  contador.textContent = `${listaJogos.length} jogos`;

  if (listaJogos.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full bg-[#16202d] border border-[#2a475e]/60 rounded p-10 text-center text-[#8f98a0]">
        Nenhum jogo encontrado para os filtros selecionados.
      </div>
    `;
    return;
  }

  listaJogos.forEach((jogo) => {
    const card = document.createElement("article");
    card.className = "bg-[#16202d] border border-[#2a475e]/60 hover:border-[#66c0f4] rounded overflow-hidden flex flex-col justify-between transition group";

    const bannerHd = `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${jogo.appid}/header.jpg`;
    const plataformasTexto = jogo.plataformas && jogo.plataformas.length > 0 ? jogo.plataformas.join(" • ") : "Windows";

    const corAvaliacao = jogo.avaliacao_positiva_pct >= 70
      ? "text-[#66c0f4]"
      : jogo.avaliacao_positiva_pct >= 40
      ? "text-amber-400"
      : "text-[#8f98a0]";

    let blocoPreco = "";
    if (jogo.gratuito) {
      blocoPreco = `<span class="text-sm font-bold text-[#a4d007] uppercase">Gratuito</span>`;
    } else if (jogo.desconto_pct > 0) {
      blocoPreco = `
        <div class="flex items-center bg-[#101822] rounded overflow-hidden">
          <span class="bg-[#4c6b22] text-[#beee11] text-xs font-bold px-2 py-1.5">-${jogo.desconto_pct}%</span>
          <div class="px-2.5 py-0.5 text-right leading-tight">
            <p class="text-[10px] text-[#8f98a0] line-through">R$ ${jogo.preco_original.toFixed(2).replace(".", ",")}</p>
            <p class="text-xs font-bold text-[#beee11]">R$ ${jogo.preco_final.toFixed(2).replace(".", ",")}</p>
          </div>
        </div>
      `;
    } else {
      blocoPreco = `<span class="text-sm font-bold text-white">R$ ${jogo.preco_final.toFixed(2).replace(".", ",")}</span>`;
    }

    card.innerHTML = `
      <div>
        <div class="relative aspect-[460/215] bg-[#101822] overflow-hidden">
          <img
            src="${bannerHd}"
            onerror="this.onerror=null; this.src='${jogo.imagem}';"
            alt="${jogo.titulo}"
            class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        </div>

        <div class="p-4 space-y-2">
          <h3 class="font-bold text-white text-sm line-clamp-1" title="${jogo.titulo}">${jogo.titulo}</h3>

          <div class="flex items-center justify-between text-xs text-[#8f98a0]">
            <span class="flex items-center gap-1.5">
              ${ICONE_WINDOWS}
              <span>${plataformasTexto}</span>
            </span>
            <span>${jogo.data_lancamento}</span>
          </div>

          <div class="pt-1 flex items-center justify-between text-xs">
            <span class="${corAvaliacao} font-medium">${jogo.avaliacao_resumo}</span>
            <span class="text-[#8f98a0]">${jogo.avaliacao_positiva_pct}% aprovação</span>
          </div>
        </div>
      </div>

      <div class="px-4 pb-4 pt-2 border-t border-[#2a475e]/40 space-y-2.5">
        <div class="flex items-center justify-between">
          ${blocoPreco}
          <a
            href="${jogo.url_origem}"
            target="_blank"
            class="inline-flex items-center gap-1.5 bg-[#2a475e]/70 hover:bg-[#66c0f4] hover:text-[#171a21] text-[#c7d5e0] text-xs font-semibold px-3 py-1.5 rounded transition"
          >
            <span>Ver na Loja</span>
            ${ICONE_LINK_EXTERNO}
          </a>
        </div>
        <div class="flex items-center gap-1 text-[11px] text-[#8f98a0]/80">
          ${ICONE_RELOGIO}
          <span>Coletado em ${jogo.data_coleta}</span>
        </div>
      </div>
    `;

    grid.append(card);
  });
};

const renderizarTabelaJogos = (listaJogos) => {
  const tbody = document.querySelector("#tabela-jogos");
  tbody.innerHTML = "";

  if (listaJogos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-8 text-center text-[#8f98a0]">
          Nenhum jogo encontrado para esses filtros.
        </td>
      </tr>
    `;
    return;
  }

  listaJogos.forEach((jogo) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-[#1b2838]/60 transition";

    const precoFormatado = jogo.gratuito
      ? `<span class="text-[#a4d007] font-semibold">Gratuito</span>`
      : `<span class="font-semibold text-white">R$ ${jogo.preco_final.toFixed(2).replace(".", ",")}</span>`;

    const badgeDesconto = jogo.desconto_pct > 0
      ? `<span class="bg-[#4c6b22] text-[#beee11] text-xs font-bold px-2 py-0.5 rounded">-${jogo.desconto_pct}%</span>`
      : `<span class="text-[#8f98a0] text-xs">—</span>`;

    const plataformasTexto = jogo.plataformas ? jogo.plataformas.join(", ") : "Windows";

    tr.innerHTML = `
      <td class="py-3 px-4">
        <div class="flex items-center gap-3">
          <img src="${jogo.imagem}" alt="${jogo.titulo}" class="w-24 h-10 object-cover rounded border border-[#2a475e]" />
          <div>
            <p class="font-semibold text-white">${jogo.titulo}</p>
            <p class="text-xs text-[#8f98a0]">${plataformasTexto}</p>
          </div>
        </div>
      </td>
      <td class="py-3 px-4 text-[#c7d5e0]">${jogo.data_lancamento}</td>
      <td class="py-3 px-4">
        <p class="text-xs text-white">${jogo.avaliacao_resumo}</p>
        <p class="text-xs text-[#66c0f4]">${jogo.avaliacao_positiva_pct}% positivas</p>
      </td>
      <td class="py-3 px-4">${badgeDesconto}</td>
      <td class="py-3 px-4">${precoFormatado}</td>
      <td class="py-3 px-4 text-xs text-[#8f98a0]">${jogo.data_coleta}</td>
      <td class="py-3 px-4">
        <a href="${jogo.url_origem}" target="_blank" class="inline-flex items-center gap-1 text-xs text-[#66c0f4] hover:underline">
          <span>Abrir</span>
          ${ICONE_LINK_EXTERNO}
        </a>
      </td>
    `;

    tbody.append(tr);
  });
};

// Alternar entre Vitrine de Cards e Visão em Tabela
const btnModoCards = document.querySelector("#btn-modo-cards");
const btnModoTabela = document.querySelector("#btn-modo-tabela");
const gridJogos = document.querySelector("#grid-jogos");
const containerTabela = document.querySelector("#container-tabela");

btnModoCards.addEventListener("click", () => {
  gridJogos.classList.remove("hidden");
  containerTabela.classList.add("hidden");
  btnModoCards.className = "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded bg-[#66c0f4] text-[#171a21] transition cursor-pointer";
  btnModoTabela.className = "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded bg-[#16202d] text-[#c7d5e0] border border-[#2a475e] hover:border-[#66c0f4] transition cursor-pointer";
});

btnModoTabela.addEventListener("click", () => {
  gridJogos.classList.add("hidden");
  containerTabela.classList.remove("hidden");
  btnModoTabela.className = "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded bg-[#66c0f4] text-[#171a21] transition cursor-pointer";
  btnModoCards.className = "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded bg-[#16202d] text-[#c7d5e0] border border-[#2a475e] hover:border-[#66c0f4] transition cursor-pointer";
});

// Eventos dos filtros
document.querySelector("#btn-filtrar").addEventListener("click", buscarJogos);

document.querySelector("#btn-limpar").addEventListener("click", () => {
  document.querySelector("#filtro-termo").value = "";
  document.querySelector("#filtro-preco-max").value = "";
  document.querySelector("#filtro-ordenacao").value = "padrao";
  document.querySelector("#filtro-promocao").checked = false;
  buscarJogos();
});

document.querySelector("#btn-atualizar-coleta").addEventListener("click", async () => {
  mostrarMensagem("Sincronizando 6 páginas do catálogo da Steam... aguarde alguns segundos.");
  await fetch(`${URL_API}/coletar?paginas=6`, { method: "POST" });
  await carregarEstatisticas();
  await buscarJogos();
  mostrarMensagem("Catálogo sincronizado com sucesso no MongoDB!");
});

// Inicialização
if (window.location.hash === "#estatisticas") {
  abrirPaginaEstatisticas();
}
carregarEstatisticas();
buscarJogos();
