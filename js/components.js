// Componentes reutilizaveis do site (header, nav e footer)


class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header>
        <p class="site-title">Disciplina Design de Interação</p>
        <p>Portfólio de Trabalhos Práticos</p>
      </header>
    `;
  }
}

class SiteNav extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <nav>
        <ul>
          <li><a href="index.html">Apresentação</a></li>
          <li><a href="editor.html">Trabalho 1 (Editor)</a></li>
          <li><a href="prova.html">Trabalho 2 (Prova)</a></li>
        </ul>
      </nav>
    `;
  }
}

class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer>
        <p>&copy; 2026 - Análise e Desenvolvimento de Sistemas</p>
      </footer>
    `;
  }
}

customElements.define("site-header", SiteHeader);
customElements.define("site-nav", SiteNav);
customElements.define("site-footer", SiteFooter);

class WorkCard extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>
        :host {
          display: block;
          flex: 1;
          min-width: min(250px, 100%);
        }
        .card {
          height: 100%;
          box-sizing: border-box;
          background-color: var(--bg-color);
          padding: 20px;
          border-radius: 6px;
          border: 1px solid var(--border-color);
        }
        h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 10px;
          color: var(--primary-color);
        }
        ::slotted(img) {
          width: 24px;
          height: 24px;
          object-fit: contain;
        }
        ::slotted(p) {
          margin: 0;
        }
      </style>
      <article class="card">
        <h3>
          <slot name="icone"><span aria-hidden="true">📄</span></slot>
          <slot name="titulo">Trabalho sem título</slot>
        </h3>
        <slot></slot>
      </article>
    `;
  }
}

customElements.define("work-card", WorkCard);