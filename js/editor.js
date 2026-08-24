// Selecionando elementos do DOM
const btnAddItem = document.querySelector("#btnAddItem");
const btnRemoveItem = document.querySelector("#btnRemoveItem");
const selectItem = document.querySelector("#selectItem");
const itemTextInput = document.querySelector("#itemText");

const imageUpload = document.querySelector("#imageUpload");
const btnRemoveImage = document.querySelector("#btnRemoveImage");

const bgMenuColor = document.querySelector("#bgMenuColor");
const bgItemColor = document.querySelector("#bgItemColor");
const textColor = document.querySelector("#textColor");
const borderColor = document.querySelector("#borderColor");
const fontSize = document.querySelector("#fontSize");
const borderRadius = document.querySelector("#borderRadius");
const flexDirection = document.querySelector("#flexDirection");
const justifyContent = document.querySelector("#justifyContent");

const generatedMenu = document.querySelector("#generatedMenu");
const generatedMenuList = document.querySelector("#generatedMenuList");

// Variaveis de controle
let itemCount = 0;
const MAX_ITEMS = 6;
let menuImageElement = null;

// Inicializacao
function init() {
  // Adiciona 3 itens iniciais
  addItem();
  addItem();
  addItem();
  updateStyles();
}

// Funcao para adicionar um novo item ao menu
function addItem() {
  if (itemCount >= MAX_ITEMS) {
    return; // Limite de segurança
  }

  itemCount++;

  // Cria elemento na lista do menu
  const li = document.createElement("li");
  li.className = "menu-item";
  li.textContent = `Item ${itemCount}`;
  li.setAttribute("data-id", itemCount);
  generatedMenuList.appendChild(li);

  // Cria opcao no select do formulario
  const option = document.createElement("option");
  option.value = itemCount;
  option.textContent = `Item ${itemCount}`;
  selectItem.appendChild(option);

  selectItem.value = itemCount;
  itemTextInput.value = `Item ${itemCount}`;

  updateStyles();
  checkButtonLimits();
}

// Funcao para remover o ultimo item
function removeItem() {
  if (itemCount <= 1) {
    return; // Impede remover todos os itens
  }

  // Remove da lista
  const lastItem = generatedMenuList.querySelector(`[data-id="${itemCount}"]`);
  if (lastItem) {
    lastItem.remove();
  }

  // Remove do select
  const lastOption = selectItem.querySelector(`option[value="${itemCount}"]`);
  if (lastOption) {
    lastOption.remove();
  }

  itemCount--;
  selectItem.value = itemCount;
  
  // Atualiza o texto do input com o valor do novo item selecionado
  const currentSelected = generatedMenuList.querySelector(`[data-id="${itemCount}"]`);
  if (currentSelected) {
    itemTextInput.value = currentSelected.textContent;
  }

  updateStyles();
  checkButtonLimits();
}

// Desabilita/habilita botoes para evitar erros
function checkButtonLimits() {
  btnAddItem.disabled = itemCount >= MAX_ITEMS;
  btnRemoveItem.disabled = itemCount <= 1;
}

// Atualiza o texto do item selecionado
function updateItemText() {
  const selectedId = selectItem.value;
  const targetLi = generatedMenuList.querySelector(`[data-id="${selectedId}"]`);
  if (targetLi) {
    targetLi.textContent = itemTextInput.value;
  }
}

// Quando muda o item no select, atualiza o campo de texto
function handleSelectChange() {
  const selectedId = selectItem.value;
  const targetLi = generatedMenuList.querySelector(`[data-id="${selectedId}"]`);
  if (targetLi) {
    itemTextInput.value = targetLi.textContent;
  }
}

// Leitura de Imagem via FileReader
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      if (!menuImageElement) {
        menuImageElement = document.createElement("img");
        generatedMenu.insertBefore(menuImageElement, generatedMenuList);
      }
      menuImageElement.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }
}

// Remover Imagem do Menu
function removeImage() {
  if (menuImageElement) {
    menuImageElement.remove();
    menuImageElement = null;
    imageUpload.value = "";
  }
}

// Aplica todas as configuracoes de CSS dinamicamente
function updateStyles() {
  // Estilo do Container do Menu
  generatedMenu.style.backgroundColor = bgMenuColor.value;
  generatedMenu.style.flexDirection = flexDirection.value;
  
  // Se a orientacao for coluna, ajusta o alinhamento
  if (flexDirection.value === "column") {
    generatedMenuList.style.flexDirection = "column";
  } else {
    generatedMenuList.style.flexDirection = "row";
  }

  generatedMenuList.style.justifyContent = justifyContent.value;

  // Estilo dos Itens
  const items = generatedMenuList.querySelectorAll(".menu-item");
  for (let i = 0; i < items.length; i++) { const item = items[i];
    item.style.backgroundColor = bgItemColor.value;
    item.style.color = textColor.value;
    item.style.border = `2px solid ${borderColor.value}`;
    item.style.fontSize = `${fontSize.value}px`;
    item.style.borderRadius = `${borderRadius.value}px`;
  }
}

// Escutadores de Eventos (Event Listeners)
btnAddItem.addEventListener("click", addItem);
btnRemoveItem.addEventListener("click", removeItem);
selectItem.addEventListener("change", handleSelectChange);
itemTextInput.addEventListener("input", updateItemText);

imageUpload.addEventListener("change", handleImageUpload);
btnRemoveImage.addEventListener("click", removeImage);

// Eventos de alteracao de estilo
bgMenuColor.addEventListener("input", updateStyles);
bgItemColor.addEventListener("input", updateStyles);
textColor.addEventListener("input", updateStyles);
borderColor.addEventListener("input", updateStyles);
fontSize.addEventListener("input", updateStyles);
borderRadius.addEventListener("input", updateStyles);
flexDirection.addEventListener("change", updateStyles);
justifyContent.addEventListener("change", updateStyles);

// Executa a inicializacao da pagina
init();