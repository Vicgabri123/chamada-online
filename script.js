document.addEventListener("DOMContentLoaded", () => {
  console.log("Página carregada com sucesso!");

  // Exemplo: capturar um botão de envio
  const btn = document.querySelector("button");
  if (btn) {
    btn.addEventListener("click", () => {
      alert("Ação executada!");
    });
  }
});