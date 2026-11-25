// Monta os elementos visuais (cards) a partir dos registros vindos da API.
// Todo texto do usuário entra com textContent, nunca como HTML.
import { estrelas, formatarData, formatarMedia, textoQuantidade } from "./util.js";

const modeloResultado = document.querySelector("#modeloResultado");
const modeloAvaliacao = document.querySelector("#modeloAvaliacao");

function clonar(modelo) {
  return modelo.content.firstElementChild.cloneNode(true);
}

// Preenche um elemento com as etiquetas de linguagem e nível (só as que existem)
export function preencherTags(elemento, livro) {
  elemento.replaceChildren();
  if (livro.linguagem) {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = livro.linguagem;
    elemento.append(tag);
  }
  if (livro.nivel) {
    const tag = document.createElement("span");
    tag.className = "tag tag-nivel";
    tag.dataset.nivel = livro.nivel;
    tag.textContent = livro.nivel;
    elemento.append(tag);
  }
  elemento.hidden = elemento.children.length === 0;
}

// "★★★★☆ 4,3 · 5 avaliações" (ou "Sem avaliações ainda")
export function preencherNotaLivro(elemento, livro) {
  elemento.replaceChildren();

  if (livro.qtd_avaliacoes === 0) {
    elemento.textContent = "Sem avaliações ainda";
    return;
  }

  if (livro.media !== null) {
    const spanEstrelas = document.createElement("span");
    spanEstrelas.className = "estrelas";
    spanEstrelas.setAttribute("aria-hidden", "true");
    spanEstrelas.textContent = estrelas(livro.media);

    const media = document.createElement("strong");
    media.textContent = formatarMedia(livro.media);

    elemento.append(spanEstrelas, " ", media, ` · ${textoQuantidade(livro.qtd_avaliacoes)}`);
  } else {
    elemento.textContent = `Sem notas · ${textoQuantidade(livro.qtd_avaliacoes)}`;
  }
}

// "4 de 5 recomendam" (escondido se ninguém respondeu)
export function preencherRecomendacaoLivro(elemento, livro) {
  if (livro.qtd_respostas_recomenda > 0) {
    elemento.textContent = `👍 ${livro.qtd_recomenda} de ${livro.qtd_respostas_recomenda} recomendam`;
    elemento.hidden = false;
  } else {
    elemento.textContent = "";
    elemento.hidden = true;
  }
}

function preencherTextoOpcional(elemento, texto) {
  if (texto) {
    elemento.textContent = texto;
  } else {
    elemento.remove();
  }
}

// Card de um livro na lista de resultados da busca
export function criarCardResultado(livro) {
  const card = clonar(modeloResultado);

  card.querySelector(".livro-titulo").textContent = livro.titulo;
  preencherTextoOpcional(card.querySelector(".livro-autor"), livro.autor);
  preencherTags(card.querySelector(".livro-tags"), livro);
  preencherNotaLivro(card.querySelector(".livro-nota"), livro);
  preencherRecomendacaoLivro(card.querySelector(".livro-recomenda"), livro);

  const linkVer = card.querySelector(".link-ver");
  linkVer.href = `#livro/${livro.id}`;
  linkVer.setAttribute("aria-label", `Ver avaliações de ${livro.titulo}`);

  const linkAvaliar = card.querySelector(".link-avaliar");
  linkAvaliar.href = `#avaliar/${livro.id}`;
  linkAvaliar.setAttribute("aria-label", `Avaliar ${livro.titulo}`);

  return card;
}

// Preenche um dos três destaques. Sem livro, o espaço fica em branco.
export function preencherDestaque(destaque, livro, tipo) {
  const corpo = destaque.querySelector(".destaque-corpo");
  corpo.replaceChildren();
  destaque.classList.toggle("vazio", !livro);

  if (!livro) {
    return;
  }

  // O link cobre o card inteiro (ver CSS .destaque-link::after)
  const link = document.createElement("a");
  link.className = "destaque-link";
  link.href = `#livro/${livro.id}`;
  link.textContent = livro.titulo;

  const titulo = document.createElement("p");
  titulo.className = "destaque-titulo";
  titulo.append(link);
  corpo.append(titulo);

  if (livro.autor) {
    const autor = document.createElement("p");
    autor.className = "livro-autor";
    autor.textContent = livro.autor;
    corpo.append(autor);
  }

  const metrica = document.createElement("p");
  metrica.className = "destaque-metrica";
  if (tipo === "mais-avaliado") {
    metrica.textContent = textoQuantidade(livro.qtd_avaliacoes);
  } else if (tipo === "melhor-avaliado") {
    const spanEstrelas = document.createElement("span");
    spanEstrelas.className = "estrelas";
    spanEstrelas.setAttribute("aria-hidden", "true");
    spanEstrelas.textContent = estrelas(livro.media);
    metrica.append(spanEstrelas, ` ${formatarMedia(livro.media)}`);
  } else {
    metrica.textContent = `Cadastrado em ${formatarData(livro.created_at)}`;
  }
  corpo.append(metrica);
}

function preencherNotaAvaliacao(dd, nota) {
  if (nota === null) {
    dd.textContent = "—";
    dd.classList.add("sem-nota");
    return;
  }
  const spanEstrelas = document.createElement("span");
  spanEstrelas.className = "estrelas";
  spanEstrelas.setAttribute("aria-hidden", "true");
  spanEstrelas.textContent = estrelas(nota);
  dd.append(spanEstrelas, ` ${nota}/5`);
}

// Card de uma avaliação na tela do livro
export function criarCardAvaliacao(avaliacao) {
  const card = clonar(modeloAvaliacao);

  card.querySelector(".avaliador").textContent = avaliacao.avaliador || "Aluno anônimo";
  card.querySelector(".data").textContent = `em ${formatarData(avaliacao.created_at)}`;

  preencherNotaAvaliacao(card.querySelector(".nota-didatica"), avaliacao.nota_didatica);
  preencherNotaAvaliacao(card.querySelector(".nota-exemplos"), avaliacao.nota_exemplos);
  preencherNotaAvaliacao(card.querySelector(".nota-exercicios"), avaliacao.nota_exercicios);

  const recomenda = card.querySelector(".livro-recomenda");
  if (avaliacao.recomenda === null) {
    recomenda.remove();
  } else {
    recomenda.textContent = avaliacao.recomenda ? "👍 Recomenda este livro" : "👎 Não recomenda";
    recomenda.classList.add(avaliacao.recomenda ? "sim" : "nao");
  }

  preencherTextoOpcional(card.querySelector(".livro-comentario"), avaliacao.comentario);

  card.querySelector(".link-editar").href = `#editar-avaliacao/${avaliacao.id}`;
  const btnExcluir = card.querySelector(".btn-excluir");
  btnExcluir.dataset.id = avaliacao.id;
  btnExcluir.setAttribute("aria-label", `Excluir avaliação de ${avaliacao.avaliador || "aluno anônimo"}`);

  return card;
}
