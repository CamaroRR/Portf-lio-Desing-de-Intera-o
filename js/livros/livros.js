// Módulo principal da página do catálogo.
// A página tem três telas, escolhidas pelo endereço depois do "#":
//   (vazio)               -> consulta: busca + destaques
//   #livro/5              -> livro 5 e suas avaliações
//   #cadastrar            -> formulário: novo livro + primeira avaliação
//   #avaliar/5            -> formulário: nova avaliação do livro 5
//   #editar-avaliacao/9   -> formulário: alterar a avaliação 9
//   #editar-livro/5       -> formulário: alterar os dados do livro 5
// Assim o botão "voltar" do navegador também funciona.

import {
  listarDestaques, buscarLivros, buscarLivro, listarAvaliacoes, buscarAvaliacao,
  cadastrarLivroComAvaliacao, criarAvaliacao, atualizarAvaliacao, atualizarLivro,
  excluirLivro, excluirAvaliacao
} from "./api.js";
import { configuracaoPendente } from "./config.js";
import { extrairPalavras } from "./busca.js";
import { mostrarAviso, esconderAviso, textoQuantidade } from "./util.js";
import {
  criarCardResultado, preencherDestaque, criarCardAvaliacao,
  preencherTags, preencherNotaLivro, preencherRecomendacaoLivro
} from "./cards.js";
import {
  abrirFormulario, lerDadosLivro, lerDadosAvaliacao, validarFormulario, bloquearFormulario
} from "./formulario.js";

// ----- Elementos -----
const aviso = document.querySelector("#aviso");
const carregandoTela = document.querySelector("#carregandoTela");
const telas = {
  inicio: document.querySelector("#telaInicio"),
  livro: document.querySelector("#telaLivro"),
  formulario: document.querySelector("#telaFormulario")
};

const formBusca = document.querySelector("#formBusca");
const campoBusca = document.querySelector("#campoBusca");
const resultados = document.querySelector("#resultados");
const resumoBusca = document.querySelector("#resumoBusca");
const listaResultados = document.querySelector("#listaResultados");
const chamadaNenhumDesses = document.querySelector("#chamadaNenhumDesses");
const chamadaSemResultados = document.querySelector("#chamadaSemResultados");
const textoSemResultados = document.querySelector("#textoSemResultados");

const destaqueMaisAvaliado = document.querySelector("#destaqueMaisAvaliado");
const destaqueMelhorAvaliado = document.querySelector("#destaqueMelhorAvaliado");
const destaqueUltimoCadastrado = document.querySelector("#destaqueUltimoCadastrado");

const tituloLivro = document.querySelector("#tituloLivro");
const autorLivro = document.querySelector("#autorLivro");
const tagsLivro = document.querySelector("#tagsLivro");
const notaLivro = document.querySelector("#notaLivro");
const recomendaLivro = document.querySelector("#recomendaLivro");
const linkAvaliarLivro = document.querySelector("#linkAvaliarLivro");
const linkEditarLivro = document.querySelector("#linkEditarLivro");
const btnExcluirLivro = document.querySelector("#btnExcluirLivro");
const listaAvaliacoes = document.querySelector("#listaAvaliacoes");

const formLivro = document.querySelector("#formLivro");

const dialogConfirmar = document.querySelector("#dialogConfirmar");
const textoConfirmacao = document.querySelector("#textoConfirmacao");
const btnCancelarDialogo = document.querySelector("#btnCancelarDialogo");
const btnConfirmarDialogo = document.querySelector("#btnConfirmarDialogo");

// ----- Estado da página -----
let avisoPendente = null;       // aviso para mostrar depois de trocar de tela
let numeroRota = 0;             // ignora carregamentos de telas antigas
let numeroBusca = 0;            // ignora respostas de buscas antigas
let temporizadorBusca = null;
let primeiraTela = true;
let livroAberto = null;         // livro da tela "livro"
let avaliacoesAbertas = [];     // avaliações mostradas na tela "livro"
let contextoFormulario = null;  // { modo, livro, avaliacao } do formulário aberto
let acaoConfirmada = null;      // o que fazer ao confirmar o <dialog>

// ===== Navegação entre telas =====

// Troca de tela pelo endereço; o aviso aparece na tela de destino
function navegar(rota, mensagem = null) {
  avisoPendente = mensagem;
  const destino = rota ? `#${rota}` : "";
  if (window.location.hash === destino) {
    mostrarRota(); // mesmo endereço: o evento hashchange não dispararia
  } else {
    window.location.hash = rota;
  }
}

function mostrarTela(nome) {
  carregandoTela.hidden = true;
  Object.entries(telas).forEach(([chave, tela]) => {
    tela.hidden = chave !== nome;
  });

  // Leva o foco ao título da tela (ajuda quem usa teclado ou leitor de tela)
  if (!primeiraTela) {
    telas[nome].querySelector(".titulo-tela").focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }
  primeiraTela = false;
}

function mostrarCarregando() {
  Object.values(telas).forEach((tela) => {
    tela.hidden = true;
  });
  carregandoTela.hidden = false;
}

function lerRota() {
  const [nome, id] = window.location.hash.replace(/^#/, "").split("/");
  return { nome: nome || "inicio", id };
}

async function mostrarRota() {
  const rotaAtual = ++numeroRota;
  const { nome, id } = lerRota();

  esconderAviso(aviso);
  if (avisoPendente) {
    mostrarAviso(aviso, avisoPendente.texto, avisoPendente.tipo);
    avisoPendente = null;
  }

  // Confere se esta ainda é a tela pedida (o usuário pode ter clicado em outra)
  const aindaAtual = () => rotaAtual === numeroRota;

  try {
    if (nome === "livro") {
      await abrirTelaLivro(id, aindaAtual);
    } else if (nome === "cadastrar") {
      abrirTelaFormulario("cadastrar", { tituloSugerido: campoBusca.value.trim() });
    } else if (nome === "avaliar") {
      mostrarCarregando();
      const livro = await buscarLivro(id);
      if (!aindaAtual()) {
        return;
      }
      if (!livro) {
        throw new Error("Livro não encontrado. Ele pode ter sido excluído.");
      }
      abrirTelaFormulario("avaliar", { livro, destinoCancelar: `#livro/${livro.id}` });
    } else if (nome === "editar-avaliacao") {
      mostrarCarregando();
      const avaliacao = await buscarAvaliacao(id);
      const livro = avaliacao ? await buscarLivro(avaliacao.livro_id) : null;
      if (!aindaAtual()) {
        return;
      }
      if (!avaliacao || !livro) {
        throw new Error("Avaliação não encontrada. Ela pode ter sido excluída.");
      }
      abrirTelaFormulario("editar-avaliacao", { livro, avaliacao, destinoCancelar: `#livro/${livro.id}` });
    } else if (nome === "editar-livro") {
      mostrarCarregando();
      const livro = await buscarLivro(id);
      if (!aindaAtual()) {
        return;
      }
      if (!livro) {
        throw new Error("Livro não encontrado. Ele pode ter sido excluído.");
      }
      abrirTelaFormulario("editar-livro", { livro, destinoCancelar: `#livro/${livro.id}` });
    } else {
      abrirTelaInicio();
    }
  } catch (erro) {
    if (!aindaAtual()) {
      return;
    }
    // Se algo der errado ao abrir uma tela, volta para a consulta com o aviso
    navegar("", { texto: erro.message, tipo: "erro" });
  }
}

// ===== Tela 1: consulta (busca + destaques) =====

function abrirTelaInicio() {
  mostrarTela("inicio");
  carregarDestaques();
  // Refaz a busca que estava na tela (os dados podem ter mudado)
  if (campoBusca.value.trim()) {
    executarBusca();
  }
}

async function carregarDestaques() {
  try {
    const destaques = await listarDestaques();
    preencherDestaque(destaqueMaisAvaliado, destaques.maisAvaliado, "mais-avaliado");
    preencherDestaque(destaqueMelhorAvaliado, destaques.melhorAvaliado, "melhor-avaliado");
    preencherDestaque(destaqueUltimoCadastrado, destaques.ultimoCadastrado, "ultimo-cadastrado");
  } catch (erro) {
    mostrarAviso(aviso, `Não foi possível carregar os destaques. ${erro.message}`, "erro");
  }
}

function esconderChamadas() {
  chamadaNenhumDesses.hidden = true;
  chamadaSemResultados.hidden = true;
}

async function executarBusca() {
  const buscaAtual = ++numeroBusca;
  const textoDigitado = campoBusca.value.trim();
  const palavras = extrairPalavras(textoDigitado);

  listaResultados.replaceChildren();
  esconderChamadas();

  if (!textoDigitado) {
    resultados.hidden = true;
    return;
  }

  resultados.hidden = false;
  if (palavras.length === 0) {
    resumoBusca.textContent = "Digite uma palavra com pelo menos 3 letras (palavras como \"de\", \"um\" e \"para\" são ignoradas).";
    return;
  }

  resumoBusca.textContent = "Buscando...";
  try {
    const livros = await buscarLivros(palavras);
    if (buscaAtual !== numeroBusca) {
      return; // chegou a resposta de uma busca antiga
    }
    mostrarResultados(livros, palavras);
  } catch (erro) {
    if (buscaAtual === numeroBusca) {
      resumoBusca.textContent = `Não foi possível buscar. ${erro.message}`;
    }
  }
}

function mostrarResultados(livros, palavras) {
  const termos = palavras.map((palavra) => `"${palavra}"`).join(" e ");

  if (livros.length === 0) {
    resumoBusca.textContent = "";
    textoSemResultados.textContent = `Não encontramos nenhum livro com ${termos}.`;
    chamadaSemResultados.hidden = false;
    return;
  }

  resumoBusca.textContent = livros.length === 1
    ? `1 livro encontrado com ${termos}`
    : `${livros.length} livros encontrados com ${termos}`;
  livros.forEach((livro) => listaResultados.append(criarCardResultado(livro)));
  chamadaNenhumDesses.hidden = false;
}

// ===== Tela 2: um livro e suas avaliações =====

async function abrirTelaLivro(id, aindaAtual) {
  mostrarCarregando();
  const [livro, avaliacoes] = await Promise.all([buscarLivro(id), listarAvaliacoes(id)]);
  if (!aindaAtual()) {
    return;
  }
  if (!livro) {
    throw new Error("Livro não encontrado. Ele pode ter sido excluído.");
  }

  livroAberto = livro;
  avaliacoesAbertas = avaliacoes;

  tituloLivro.textContent = livro.titulo;
  autorLivro.textContent = livro.autor || "";
  autorLivro.hidden = !livro.autor;
  preencherTags(tagsLivro, livro);
  preencherNotaLivro(notaLivro, livro);
  preencherRecomendacaoLivro(recomendaLivro, livro);
  linkAvaliarLivro.href = `#avaliar/${livro.id}`;
  linkEditarLivro.href = `#editar-livro/${livro.id}`;

  listaAvaliacoes.replaceChildren();
  if (avaliacoes.length === 0) {
    const vazio = document.createElement("p");
    vazio.className = "lista-vazia";
    vazio.textContent = "Este livro ainda não tem avaliações. Que tal ser o primeiro?";
    listaAvaliacoes.append(vazio);
  } else {
    avaliacoes.forEach((avaliacao) => listaAvaliacoes.append(criarCardAvaliacao(avaliacao)));
  }

  mostrarTela("livro");
}

// ===== Tela 3: formulário =====

function abrirTelaFormulario(modo, opcoes) {
  contextoFormulario = { modo, livro: opcoes.livro, avaliacao: opcoes.avaliacao };
  abrirFormulario(modo, opcoes);
  mostrarTela("formulario");
}

async function salvarFormulario(evento) {
  evento.preventDefault();
  esconderAviso(aviso);

  const erro = validarFormulario();
  if (erro) {
    mostrarAviso(aviso, erro, "erro");
    return;
  }

  const { modo, livro, avaliacao } = contextoFormulario;
  bloquearFormulario(true);

  try {
    if (modo === "cadastrar") {
      const novoLivro = await cadastrarLivroComAvaliacao(lerDadosLivro(), lerDadosAvaliacao());
      navegar("", { texto: `"${novoLivro.titulo}" foi cadastrado com a sua avaliação. Obrigado!`, tipo: "sucesso" });
    } else if (modo === "avaliar") {
      await criarAvaliacao({ ...lerDadosAvaliacao(), livro_id: livro.id });
      navegar("", { texto: `Sua avaliação de "${livro.titulo}" foi enviada. Obrigado!`, tipo: "sucesso" });
    } else if (modo === "editar-avaliacao") {
      await atualizarAvaliacao(avaliacao.id, lerDadosAvaliacao());
      navegar(`livro/${livro.id}`, { texto: "Avaliação alterada com sucesso.", tipo: "sucesso" });
    } else if (modo === "editar-livro") {
      await atualizarLivro(livro.id, lerDadosLivro());
      navegar(`livro/${livro.id}`, { texto: "Dados do livro alterados com sucesso.", tipo: "sucesso" });
    }
  } catch (erroSalvar) {
    bloquearFormulario(false);
    mostrarAviso(aviso, `Não foi possível salvar. ${erroSalvar.message}`, "erro");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// ===== Exclusão com caixa de confirmação =====

function pedirConfirmacao(texto, acao) {
  textoConfirmacao.textContent = texto;
  acaoConfirmada = acao;
  dialogConfirmar.showModal();
}

async function confirmarDialogo() {
  btnConfirmarDialogo.disabled = true;
  btnConfirmarDialogo.textContent = "Excluindo...";
  try {
    await acaoConfirmada();
  } catch (erro) {
    mostrarAviso(aviso, `Não foi possível excluir. ${erro.message}`, "erro");
  } finally {
    dialogConfirmar.close();
    btnConfirmarDialogo.disabled = false;
    btnConfirmarDialogo.textContent = "Excluir";
  }
}

function pedirExclusaoLivro() {
  const livro = livroAberto;
  const avaliacoes = livro.qtd_avaliacoes > 0
    ? ` e ${livro.qtd_avaliacoes === 1 ? "a sua avaliação" : `as suas ${textoQuantidade(livro.qtd_avaliacoes)}`}`
    : "";
  pedirConfirmacao(`Excluir o livro "${livro.titulo}"${avaliacoes}? Essa ação não pode ser desfeita.`, async () => {
    await excluirLivro(livro.id);
    navegar("", { texto: `O livro "${livro.titulo}" foi excluído.`, tipo: "sucesso" });
  });
}

function pedirExclusaoAvaliacao(id) {
  const avaliacao = avaliacoesAbertas.find((item) => item.id === id);
  if (!avaliacao) {
    return;
  }
  const autor = avaliacao.avaliador ? `de ${avaliacao.avaliador}` : "anônima";
  pedirConfirmacao(`Excluir a avaliação ${autor} do livro "${livroAberto.titulo}"? Essa ação não pode ser desfeita.`, async () => {
    await excluirAvaliacao(id);
    navegar(`livro/${livroAberto.id}`, { texto: "Avaliação excluída.", tipo: "sucesso" });
  });
}

// ===== Eventos =====

window.addEventListener("hashchange", mostrarRota);

formBusca.addEventListener("submit", (evento) => {
  evento.preventDefault();
  clearTimeout(temporizadorBusca);
  executarBusca();
});

// Busca enquanto digita, esperando o usuário parar por um instante
campoBusca.addEventListener("input", () => {
  clearTimeout(temporizadorBusca);
  temporizadorBusca = setTimeout(executarBusca, 400);
});

btnExcluirLivro.addEventListener("click", pedirExclusaoLivro);

// Delegação: um único listener para os botões "Excluir" de todas as avaliações
listaAvaliacoes.addEventListener("click", (evento) => {
  const botao = evento.target.closest(".btn-excluir");
  if (botao) {
    pedirExclusaoAvaliacao(Number(botao.dataset.id));
  }
});

formLivro.addEventListener("submit", salvarFormulario);

btnCancelarDialogo.addEventListener("click", () => dialogConfirmar.close());
btnConfirmarDialogo.addEventListener("click", confirmarDialogo);

// Clicar fora da caixa de diálogo também cancela
dialogConfirmar.addEventListener("click", (evento) => {
  if (evento.target === dialogConfirmar) {
    dialogConfirmar.close();
  }
});

// ===== Início =====

if (configuracaoPendente()) {
  mostrarTela("inicio");
  formBusca.inert = true;
  mostrarAviso(aviso, "Configure a URL e a chave do Supabase no arquivo js/livros/config.js.", "erro");
} else {
  mostrarRota();
}
