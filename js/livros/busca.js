// Transforma o texto digitado na busca em uma lista de palavras válidas

export const TAMANHO_MINIMO = 3;

// Palavras comuns que não ajudam a encontrar um livro
// (as menores que 3 letras, como "de" e "um", já são ignoradas pelo tamanho)
const PALAVRAS_IGNORADAS = new Set([
  "uma", "uns", "umas", "das", "dos", "nas", "nos", "aos", "com", "sem",
  "para", "pra", "por", "pelo", "pela", "que", "como", "the", "and", "for"
]);

// "Programação" -> "programacao" (mesma regra da coluna texto_busca do banco)
export function normalizar(texto) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// "Lógica de Programação" -> ["logica", "programacao"]
// Como só sobram letras e números, as palavras podem ir direto no filtro da API.
export function extrairPalavras(texto) {
  const palavras = normalizar(texto)
    .split(/[^a-z0-9]+/)
    .filter((palavra) => palavra.length >= TAMANHO_MINIMO && !PALAVRAS_IGNORADAS.has(palavra));

  return [...new Set(palavras)]; // remove palavras repetidas
}
