// Acesso às tabelas do Supabase pela API RESTful (PostgREST), só com fetch
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

const URL_API = `${SUPABASE_URL}/rest/v1`;

function montarCabecalhos(extras = {}) {
  const cabecalhos = {
    apikey: SUPABASE_KEY,
    "Content-Type": "application/json",
    ...extras
  };
  // A chave "anon" antiga é um JWT (começa com "eyJ") e também vai no Authorization.
  // A chave nova "publishable" (sb_publishable_...) vai só no apikey.
  if (SUPABASE_KEY.startsWith("eyJ")) {
    cabecalhos.Authorization = `Bearer ${SUPABASE_KEY}`;
  }
  return cabecalhos;
}

// Faz a requisição e transforma qualquer falha em um Error com mensagem legível
async function requisicao(caminho, opcoes = {}) {
  let resposta;
  try {
    resposta = await fetch(`${URL_API}/${caminho}`, {
      ...opcoes,
      headers: montarCabecalhos(opcoes.headers)
    });
  } catch {
    throw new Error("Não foi possível conectar ao servidor. Verifique sua conexão.");
  }

  if (!resposta.ok) {
    let detalhe = `Erro ${resposta.status}`;
    try {
      const erro = await resposta.json();
      if (erro.message) {
        detalhe += `: ${erro.message}`;
      }
    } catch {
      // Resposta de erro sem JSON: mantém só o código
    }
    throw new Error(detalhe);
  }

  if (resposta.status === 204) {
    return null;
  }
  return resposta.json();
}

// Garante que o id é um número inteiro positivo antes de colocá-lo na URL
function idSeguro(id) {
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new Error("Identificador inválido.");
  }
  return numero;
}

function primeiroOuNulo(lista) {
  return lista.length > 0 ? lista[0] : null;
}

// Envia POST/PATCH/DELETE pedindo o registro de volta (return=representation).
// Lista vazia significa que nenhum registro foi encontrado com aquele id.
async function alterarRegistro(caminho, metodo, dados) {
  const registros = await requisicao(caminho, {
    method: metodo,
    headers: { Prefer: "return=representation" },
    body: dados ? JSON.stringify(dados) : undefined
  });
  if (registros.length === 0) {
    throw new Error("O registro não foi encontrado. Ele pode ter sido excluído.");
  }
  return registros[0];
}

// ===== CONSULTAR =====

// Os três destaques da página inicial (cada um pode vir null se não houver livro)
export async function listarDestaques() {
  const [maisAvaliado, melhorAvaliado, ultimoCadastrado] = await Promise.all([
    requisicao("livros_resumo?select=*&qtd_avaliacoes=gt.0&order=qtd_avaliacoes.desc,media.desc.nullslast&limit=1"),
    requisicao("livros_resumo?select=*&media=not.is.null&order=media.desc,qtd_avaliacoes.desc&limit=1"),
    requisicao("livros_resumo?select=*&order=created_at.desc&limit=1")
  ]);
  return {
    maisAvaliado: primeiroOuNulo(maisAvaliado),
    melhorAvaliado: primeiroOuNulo(melhorAvaliado),
    ultimoCadastrado: primeiroOuNulo(ultimoCadastrado)
  };
}

// Livros que contêm TODAS as palavras (as palavras já chegam normalizadas por busca.js)
export function buscarLivros(palavras) {
  const condicoes = palavras.map((palavra) => `texto_busca.ilike.*${palavra}*`).join(",");
  return requisicao(`livros_resumo?select=*&and=${encodeURIComponent(`(${condicoes})`)}&order=titulo.asc&limit=50`);
}

export async function buscarLivro(id) {
  const registros = await requisicao(`livros_resumo?select=*&id=eq.${idSeguro(id)}`);
  return primeiroOuNulo(registros);
}

export function listarAvaliacoes(livroId) {
  return requisicao(`avaliacoes?select=*&livro_id=eq.${idSeguro(livroId)}&order=created_at.desc`);
}

export async function buscarAvaliacao(id) {
  const registros = await requisicao(`avaliacoes?select=*&id=eq.${idSeguro(id)}`);
  return primeiroOuNulo(registros);
}

// ===== CRIAR =====

export async function criarAvaliacao(dados) {
  const registros = await requisicao("avaliacoes", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(dados)
  });
  return registros[0];
}

// Cadastra o livro e, em seguida, a primeira avaliação dele.
// Se a avaliação falhar, o livro recém-criado é desfeito para não ficar pela metade.
export async function cadastrarLivroComAvaliacao(dadosLivro, dadosAvaliacao) {
  const registros = await requisicao("livros", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(dadosLivro)
  });
  const livro = registros[0];

  try {
    await criarAvaliacao({ ...dadosAvaliacao, livro_id: livro.id });
  } catch (erro) {
    await excluirLivro(livro.id).catch(() => {});
    throw erro;
  }
  return livro;
}

// ===== ALTERAR =====

export function atualizarLivro(id, dados) {
  return alterarRegistro(`livros?id=eq.${idSeguro(id)}`, "PATCH", dados);
}

export function atualizarAvaliacao(id, dados) {
  return alterarRegistro(`avaliacoes?id=eq.${idSeguro(id)}`, "PATCH", dados);
}

// ===== EXCLUIR =====

// As avaliações do livro são excluídas junto pelo banco (on delete cascade)
export function excluirLivro(id) {
  return alterarRegistro(`livros?id=eq.${idSeguro(id)}`, "DELETE");
}

export function excluirAvaliacao(id) {
  return alterarRegistro(`avaliacoes?id=eq.${idSeguro(id)}`, "DELETE");
}
