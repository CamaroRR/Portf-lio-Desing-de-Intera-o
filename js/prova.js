function escaparHTML(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const estiloProva = `
  :host {
    display: block;
    font-family: var(--font-main, Arial, sans-serif);
    color: var(--text-color, #333);
  }
  [hidden] {
    display: none !important;
  }
  * {
    box-sizing: border-box;
  }
  .prova,
  .resultado {
    background-color: var(--card-bg, #fff);
    border: 1px solid var(--border-color, #ccc);
    border-radius: 8px;
    padding: clamp(16px, 4vw, 30px);
  }
  h2 {
    margin: 0 0 8px;
    color: var(--primary-color, #2c3e50);
  }
  .instrucao {
    margin: 0 0 20px;
  }
  .questao {
    border: 1px solid var(--border-color, #ccc);
    border-left: 5px solid var(--secondary-color, #3498db);
    border-radius: 6px;
    margin: 0 0 18px;
    padding: 16px;
    background-color: var(--bg-color, #f4f6f9);
  }
  legend {
    float: left;
    width: 100%;
    font-weight: bold;
    padding: 0;
  }
  .numero {
    display: block;
    font-size: 0.85em;
    color: var(--secondary-color, #3498db);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .alternativa {
    clear: both;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-top: 10px;
    padding: 10px 12px;
    border: 2px solid transparent;
    border-radius: 6px;
    background-color: #fff;
  }
  .alternativa:has(input:checked) {
    border-color: var(--secondary-color, #3498db);
  }
  .alternativa input {
    margin: 3px 0 0;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    cursor: pointer;
  }
  .alternativa label {
    flex: 1;
    cursor: pointer;
  }
  input:disabled,
  input:disabled + label {
    cursor: default;
  }

  /* Cores depois da correcao */
  .questao.certa {
    border-left-color: #2e8b57;
  }
  .questao.errada {
    border-left-color: #c0392b;
  }
  .questao .alternativa.alternativa-correta {
    border-color: #2e8b57;
    background-color: #e8f6ee;
  }
  .questao .alternativa.alternativa-errada {
    border-color: #c0392b;
    background-color: #fbeaea;
  }
  .feedback {
    margin: 10px 0 0;
    font-weight: bold;
  }
  .feedback:empty {
    display: none;
  }
  .certa .feedback {
    color: #1e6b40;
  }
  .errada .feedback {
    color: #a93226;
  }

  .progresso {
    margin: 0 0 12px;
    font-weight: bold;
  }
  button {
    font: inherit;
    font-weight: bold;
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    background-color: var(--secondary-color, #3498db);
    color: #fff;
    cursor: pointer;
    width: 100%;
    max-width: 280px;
  }
  button:hover:not(:disabled) {
    background-color: var(--primary-color, #2c3e50);
  }
  button:disabled {
    background-color: #9aa5b1;
    cursor: not-allowed;
  }
  button:focus-visible {
    outline: 3px solid var(--primary-color, #2c3e50);
    outline-offset: 2px;
  }

  /* Resultado */
  .resultado {
    margin-top: 20px;
  }
  .nota {
    font-size: 1.3em;
    margin: 0 0 16px;
  }
  .nota strong {
    font-size: 1.5em;
    color: var(--primary-color, #2c3e50);
  }
  .tabela-container {
    overflow-x: auto;
    margin-bottom: 20px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  @media (max-width: 500px) {
    table {
      font-size: 0.85em;
    }
    th,
    td {
      padding: 6px;
    }
  }
  caption {
    text-align: left;
    font-weight: bold;
    margin-bottom: 8px;
  }
  th,
  td {
    text-align: left;
    padding: 10px;
    border-bottom: 1px solid var(--border-color, #ccc);
    vertical-align: top;
  }
  td.resposta {
    overflow-wrap: anywhere;
  }
  th:first-child,
  td:first-child,
  td:last-child {
    white-space: nowrap;
  }
  th {
    background-color: var(--bg-color, #f4f6f9);
  }
  .situacao-certa {
    color: #1e6b40;
    font-weight: bold;
  }
  .situacao-errada {
    color: #a93226;
    font-weight: bold;
  }
`;

class MyTest extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.dados = dadosProva;
    this.render();
  }

  // Monta a prova a partir do objeto de dados
  render() {
    const questoesHTML = this.dados.questoes
      .map((questao, i) => this.htmlQuestao(questao, i))
      .join("");

    this.shadowRoot.innerHTML = `
      <style>${estiloProva}</style>
      <form class="prova" novalidate>
        <h2>${escaparHTML(this.dados.titulo)}</h2>
        <p class="instrucao">Marque uma alternativa em cada questão e clique em "Corrigir prova".</p>
        ${questoesHTML}
        <p class="progresso" aria-live="polite"></p>
        <button type="submit" class="btn-corrigir">Corrigir prova</button>
      </form>
      <section class="resultado" hidden></section>
    `;

    this.form = this.shadowRoot.querySelector("form");
    this.progresso = this.shadowRoot.querySelector(".progresso");
    this.btnCorrigir = this.shadowRoot.querySelector(".btn-corrigir");
    this.resultado = this.shadowRoot.querySelector(".resultado");

    this.form.addEventListener("change", () => this.atualizarProgresso());
    this.form.addEventListener("submit", (evento) => {
      evento.preventDefault();
      this.corrigir();
    });

    this.atualizarProgresso();
  }

  // HTML de uma questao: fieldset + legend + radios com label
  htmlQuestao(questao, i) {
    const alternativasHTML = questao.alternativas
      .map((alternativa, j) => `
        <div class="alternativa">
          <input type="radio" id="q${i}-a${j}" name="q${i}" value="${j}">
          <label for="q${i}-a${j}">${escaparHTML(alternativa)}</label>
        </div>
      `)
      .join("");

    return `
      <fieldset class="questao" data-indice="${i}">
        <legend>
          <span class="numero">Questão ${i + 1}</span>
          ${escaparHTML(questao.enunciado)}
        </legend>
        ${alternativasHTML}
        <p class="feedback"></p>
      </fieldset>
    `;
  }

  // Retorna o indice da alternativa marcada, ou null se nada foi marcado
  respostaMarcada(i) {
    const marcado = this.form.querySelector(`input[name="q${i}"]:checked`);
    return marcado ? Number(marcado.value) : null;
  }

  contarRespondidas() {
    let respondidas = 0;
    this.dados.questoes.forEach((questao, i) => {
      if (this.respostaMarcada(i) !== null) {
        respondidas++;
      }
    });
    return respondidas;
  }

  // Evita erro do usuario: so libera a correcao com todas as questoes respondidas
  atualizarProgresso() {
    const total = this.dados.questoes.length;
    const respondidas = this.contarRespondidas();
    this.progresso.textContent = `${respondidas} de ${total} questões respondidas`;
    this.btnCorrigir.disabled = respondidas < total;
  }

  corrigir() {
    const total = this.dados.questoes.length;
    if (this.contarRespondidas() < total) {
      return;
    }

    let acertos = 0;
    let linhasTabela = "";

    this.dados.questoes.forEach((questao, i) => {
      const marcada = this.respostaMarcada(i);
      const acertou = marcada === questao.correta;
      if (acertou) {
        acertos++;
      }

      // Destaca a questao e as alternativas
      const fieldset = this.form.querySelector(`fieldset[data-indice="${i}"]`);
      fieldset.classList.add(acertou ? "certa" : "errada");
      fieldset.querySelector(`#q${i}-a${questao.correta}`).parentElement.classList.add("alternativa-correta");
      if (!acertou) {
        fieldset.querySelector(`#q${i}-a${marcada}`).parentElement.classList.add("alternativa-errada");
      }
      fieldset.querySelector(".feedback").textContent = acertou
        ? "✔ Você acertou!"
        : `✘ Resposta correta: ${questao.alternativas[questao.correta]}`;

      linhasTabela += `
        <tr>
          <td>${i + 1}</td>
          <td class="resposta">${escaparHTML(questao.alternativas[marcada])}</td>
          <td class="resposta">${escaparHTML(questao.alternativas[questao.correta])}</td>
          <td class="${acertou ? "situacao-certa" : "situacao-errada"}">${acertou ? "✔ Certa" : "✘ Errada"}</td>
        </tr>
      `;
    });

    // Trava a prova depois de corrigida
    this.form.querySelectorAll("input").forEach((input) => {
      input.disabled = true;
    });
    this.btnCorrigir.hidden = true;
    this.progresso.hidden = true;

    const nota = ((acertos / total) * 10).toFixed(1);

    this.resultado.innerHTML = `
      <h2>Resultado</h2>
      <p class="nota">Nota: <strong>${nota}</strong> (${acertos} de ${total} acertos)</p>
      <div class="tabela-container">
        <table>
          <caption>Resumo das respostas</caption>
          <thead>
            <tr>
              <th scope="col">Nº</th>
              <th scope="col">Sua resposta</th>
              <th scope="col">Resposta correta</th>
              <th scope="col">Situação</th>
            </tr>
          </thead>
          <tbody>${linhasTabela}</tbody>
        </table>
      </div>
      <button type="button" class="btn-refazer">Refazer prova</button>
    `;
    this.resultado.hidden = false;

    this.resultado.querySelector(".btn-refazer").addEventListener("click", () => this.refazer());
    this.resultado.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Monta a prova de novo, com tudo desmarcado
  refazer() {
    this.render();
    this.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

customElements.define("my-test", MyTest);
