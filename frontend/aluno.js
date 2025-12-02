// ============================
// 🔗 Configuração automática da URL da API
// ============================
let API_URL;

// Detecta onde o frontend está sendo executado
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
  API_URL = "http://localhost:3000"; // ambiente local
} else if (window.location.hostname.includes("tunnelmole.net")) {
  // se estiver usando Tunnelmole
  API_URL = `https://${window.location.hostname}`;
} else {
  // ambiente hospedado (exemplo: Render)
  API_URL = "https://chamada-online.onrender.com";
}

console.log("🔌 Backend conectado em:", API_URL);

// ============================
// 📍 Função: Obter Localização
// ============================
// Tenta pegar a posição do aluno com alta precisão
// Caso falhe, tenta novamente com menos precisão antes de desistir
async function obterLocalizacao() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation)
      return reject("Seu navegador não suporta geolocalização.");

    // define um tempo máximo de 10 segundos para obter localização
    const timeout = setTimeout(() => reject("Tempo limite excedido."), 10000);

    navigator.geolocation.getCurrentPosition(
      pos => {
        clearTimeout(timeout);
        resolve(pos);
      },
      err => {
        clearTimeout(timeout);
        console.warn("⚠ Erro de alta precisão:", err);

        // segunda tentativa com precisão reduzida
        navigator.geolocation.getCurrentPosition(
          pos2 => resolve(pos2),
          () => reject("Não foi possível obter localização. Ative o GPS e tente novamente."),
          { enableHighAccuracy: false, timeout: 8000 }
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

// ============================
// ✍️ Função: Registrar Presença
// ============================
let tentativasFalhas = Number(localStorage.getItem("falhasGPS")) || 0;

async function registrarPresenca() {
  const botao = document.getElementById("btn-presenca");
  const nome = document.getElementById("nome").value.trim();
  const matricula = document.getElementById("matricula").value.trim();
  const justificativaInput = document.getElementById("justificativa");

  // feedback visual no botão
  botao.disabled = true;
  botao.innerText = "⏳ Enviando...";

  // validação dos campos
  if (!nome || !matricula) {
    alert("Preencha todos os campos!");
    botao.disabled = false;
    botao.innerText = "Enviar Presença";
    return;
  }

  // Validar nome só com letras
if (!/^[A-Za-zÀ-ÿ\s]+$/.test(nome)) {
  alert("O nome deve conter apenas letras.");
  return;
}

// Validar matrícula só com números
if (!/^\d+$/.test(matricula)) {
  alert("A matrícula deve conter apenas números.");
  return;
}

  // tenta obter localização
  let posicao = await obterLocalizacao().catch(() => {
    tentativasFalhas++;
    localStorage.setItem("falhasGPS", tentativasFalhas);
    return null;
  });

  let latitude = null,
    longitude = null,
    justificativa = "";

  if (posicao) {
    // conseguiu localização normalmente
    latitude = posicao.coords.latitude;
    longitude = posicao.coords.longitude;
    justificativaInput.style.display = "none";
    tentativasFalhas = 0; // Zera a contagem de falhas após sucesso de GPS
    justificativa = "";
  } else if (tentativasFalhas > 2) {
    // se falhar duas vezes, solicita justificativa
    justificativaInput.style.display = "block";
    justificativa = justificativaInput.value.trim();

     // ★ Se justificativa ainda está vazia → bloquear envio
  if (!justificativa) {
    alert("Seu GPS falhou várias vezes. Por favor, escreva uma justificativa para continuar.");
    botao.disabled = false;
    botao.innerText = "Enviar Presença";

    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("deviceId", deviceId);
    }
    return; // impede envio
  }
    
  } else {
    alert("Erro ao obter localização. Tente novamente.");
    botao.disabled = false;
    botao.innerText = "Enviar Presença";
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("deviceId", deviceId);
  }
    return;
  }

  // define horário fixo com fuso de São Paulo (evita manipulação de hora)
  const horario = new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" });

  // ============================
  // 📱 Cria ID único do dispositivo (salvo no navegador)
  // ============================
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("deviceId", deviceId);
  }

  // monta corpo da requisição
  const body = { nome, matricula, latitude, longitude, justificativa, horario, deviceId };

  // ============================
  // 📡 Envia os dados para o servidor
  // ============================
  const res = await fetch(`${API_URL}/presenca`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  const saida = document.getElementById("saida");
  saida.innerText = data.msg;

  // feedback visual no botão
  botao.disabled = false;
  botao.innerText = "✅ Enviar Presença";

  // ============================
  // 🎉 Confirmação visual de envio
  // ============================
  if (data.msg.includes("registrado com sucesso")) {
    const confirmacao = document.getElementById("confirmacao");
    const mensagem = document.getElementById("mensagem-confirmacao");
    localStorage.removeItem("falhasGPS");

    mensagem.textContent = `Presença anotada às ${horario} de ${nome}.`;
    confirmacao.style.display = "block";
    confirmacao.style.opacity = "1";

    // esconde a mensagem suavemente após 5 segundos
    setTimeout(() => {
      confirmacao.style.transition = "opacity 1s";
      confirmacao.style.opacity = "0";
      setTimeout(() => (confirmacao.style.display = "none"), 1000);
    }, 5000);
  }
}

// ============================
// 🎯 Evento principal do botão
// ============================
// Garante que o script só é ativado depois que o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  const botao = document.getElementById("btn-presenca");
  if (botao) botao.addEventListener("click", registrarPresenca);
});
