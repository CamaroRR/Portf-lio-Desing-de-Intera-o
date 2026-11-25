// Controla o formulário único, que muda conforme o modo:
// cadastrar livro + avaliação, avaliar livro, editar avaliação ou editar livro.

const form = document.querySelector("#formLivro");
const tituloFormulario = document.querySelector("#tituloFormulario");
const avaliandoLivro = document.querySelector("#avaliandoLivro");
const grupoLivro = document.querySelector("#grupoLivro");
const grupoAvaliacao = document.querySelector("#grupoAvaliacao");
const btnSalvar = document.querySelector("#btnSalvar");
const linkVoltar = document.querySelector("#linkVoltarFormulario");
const linkCancelar = document.querySelector("#linkCancelarFormulario");
const campoComentario = document.querySelector("#comentario");
const contadorComentario = document.querySelector("#contadorComentario");

// Quais partes do formulário cada modo mostra e o texto dos elementos
const MODOS = {
  cadastrar: {
    titulo: "Cadastrar novo livro",
    livro: true,
    avaliacao: true,
    botao: "Cadastrar livro e avaliação"
  },
  avaliar: {
    titulo: "Avaliar livro",
    livro: false,
    avaliacao: true,
    botao: "Enviar avaliação"
  },
  "editar-avaliacao": {
    titulo: "Editar avaliação",
    livro: false,
    avaliacao: true,
    botao: "Salvar alterações"
  },
  "editar-livro": {
    titulo: "Editar dados do livro",
    livro: true,
    avaliacao: false,
    botao: "Salvar alterações"
  }
};

const CAMPOS_TEXTO = ["titulo", "autor", "comentario", "avaliador"];

let modoAtual = MODOS.cadastrar;

function atualizarContador() {
  contadorComentario.textContent = `${campoComentario.value.length} de ${campoComentario.maxLength} caracteres`;
}

// Mostra ou esconde um grupo. Grupo desabilitado não é validado nem enviado.
function mostrarGrupo(grupo, mostrar) {
  grupo.hidden = !mostrar;
  grupo.disabled = !mostrar;
}

// Prepara o formulário para um modo.
// opcoes: { livro, avaliacao, tituloSugerido, destinoCancelar }
export function abrirFormulario(modo, opcoes = {}) {
  modoAtual = MODOS[modo];
  form.reset();
  bloquearFormulario(false);

  tituloFormulario.textContent = modoAtual.titulo;
  btnSalvar.textContent = modoAtual.botao;
  mostrarGrupo(grupoLivro, modoAtual.livro);
  mostrarGrupo(grupoAvaliacao, modoAtual.avaliacao);

  // Ao avaliar, mostra qual livro está sendo avaliado
  if (!modoAtual.livro && opcoes.livro) {
    avaliandoLivro.textContent = `Livro: ${opcoes.livro.titulo}`;
    avaliandoLivro.hidden = false;
  } else {
    avaliandoLivro.hidden = true;
  }

  if (modo === "editar-livro" && opcoes.livro) {
    preencherLivro(opcoes.livro);
  }
  if (modo === "editar-avaliacao" && opcoes.avaliacao) {
    preencherAvaliacao(opcoes.avaliacao);
  }
  if (modo === "cadastrar" && opcoes.tituloSugerido) {
    form.elements.titulo.value = opcoes.tituloSugerido;
  }

  const destino = opcoes.destinoCancelar || "#";
  linkVoltar.href = destino;
  linkCancelar.href = destino;
  atualizarContador();
}

function preencherLivro(livro) {
  const campos = form.elements;
  campos.titulo.value = livro.titulo;
  campos.autor.value = livro.autor || "";
  campos.linguagem.value = livro.linguagem || "";
  campos.nivel.value = livro.nivel || "";
}

function preencherAvaliacao(avaliacao) {
  const campos = form.elements;
  // Em um grupo de radios, definir .value marca a alternativa com aquele valor
  if (avaliacao.nota_didatica !== null) {
    campos.nota_didatica.value = String(avaliacao.nota_didatica);
  }
  if (avaliacao.nota_exemplos !== null) {
    campos.nota_exemplos.value = String(avaliacao.nota_exemplos);
  }
  if (avaliacao.nota_exercicios !== null) {
    campos.nota_exercicios.value = String(avaliacao.nota_exercicios);
  }
  if (avaliacao.recomenda !== null) {
    campos.recomenda.value = avaliacao.recomenda ? "sim" : "nao";
  }
  campos.comentario.value = avaliacao.comentario || "";
  campos.avaliador.value = avaliacao.avaliador || "";
}

// Campo vazio vira null (o banco guarda "sem valor")
function textoOuNulo(dados, nome) {
  return dados.get(nome) || null;
}

function numeroOuNulo(dados, nome) {
  const valor = dados.get(nome);
  return valor ? Number(valor) : null;
}

export function lerDadosLivro() {
  const dados = new FormData(form);
  return {
    titulo: dados.get("titulo"),
    autor: textoOuNulo(dados, "autor"),
    linguagem: textoOuNulo(dados, "linguagem"),
    nivel: textoOuNulo(dados, "nivel")
  };
}

export function lerDadosAvaliacao() {
  const dados = new FormData(form);
  const recomenda = dados.get("recomenda");
  return {
    nota_didatica: numeroOuNulo(dados, "nota_didatica"),
    nota_exemplos: numeroOuNulo(dados, "nota_exemplos"),
    nota_exercicios: numeroOuNulo(dados, "nota_exercicios"),
    recomenda: recomenda === null ? null : recomenda === "sim",
    comentario: textoOuNulo(dados, "comentario"),
    avaliador: textoOuNulo(dados, "avaliador")
  };
}

// Retorna uma mensagem de erro, ou null se estiver tudo certo
export function validarFormulario() {
  // Tira espaços do começo e do fim (um título só com espaços conta como vazio)
  CAMPOS_TEXTO.forEach((nome) => {
    const campo = form.elements[nome];
    campo.value = campo.value.trim();
  });
  atualizarContador();

  // Validação nativa: título obrigatório e tamanhos máximos (mostra o balão do navegador)
  if (!form.reportValidity()) {
    return "Preencha o título do livro.";
  }

  if (modoAtual.avaliacao) {
    const avaliacao = lerDadosAvaliacao();
    const algumaInformacao = avaliacao.nota_didatica !== null
      || avaliacao.nota_exemplos !== null
      || avaliacao.nota_exercicios !== null
      || avaliacao.recomenda !== null
      || avaliacao.comentario !== null;

    if (!algumaInformacao) {
      return "Preencha pelo menos uma nota, a recomendação ou um comentário.";
    }
  }
  return null;
}

// Trava o formulário enquanto salva, para evitar cliques repetidos
export function bloquearFormulario(bloquear) {
  form.inert = bloquear;
  btnSalvar.disabled = bloquear;
  btnSalvar.textContent = bloquear ? "Salvando..." : modoAtual.botao;
}

// ----- Eventos internos do formulário -----

campoComentario.addEventListener("input", atualizarContador);

// Botões "Limpar": desmarcam o grupo de radios (radio não desmarca sozinho)
form.addEventListener("click", (evento) => {
  const botao = evento.target.closest(".btn-limpar");
  if (!botao) {
    return;
  }
  form.querySelectorAll(`input[name="${botao.dataset.limpar}"]`).forEach((radio) => {
    radio.checked = false;
  });
});
