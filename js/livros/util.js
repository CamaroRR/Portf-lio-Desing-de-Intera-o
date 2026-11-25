// Funções auxiliares de formatação e avisos

// 4 -> "★★★★☆"
export function estrelas(nota) {
  const valor = Math.max(0, Math.min(5, Math.round(Number(nota))));
  return "★".repeat(valor) + "☆".repeat(5 - valor);
}

// "2026-11-24T21:00:00+00:00" -> "24/11/2026"
export function formatarData(textoData) {
  return new Date(textoData).toLocaleDateString("pt-BR");
}

// 4.333 -> "4,3"
export function formatarMedia(media) {
  return Number(media).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
}

// 1 -> "1 avaliação", 3 -> "3 avaliações"
export function textoQuantidade(quantidade) {
  return quantidade === 1 ? "1 avaliação" : `${quantidade} avaliações`;
}

// Mostra a caixa de aviso no topo (tipo "sucesso" ou "erro")
export function mostrarAviso(elemento, texto, tipo = "sucesso") {
  elemento.textContent = texto;
  elemento.className = `aviso aviso-${tipo}`;
  elemento.hidden = false;
}

export function esconderAviso(elemento) {
  elemento.textContent = "";
  elemento.hidden = true;
}
