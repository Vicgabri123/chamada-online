/* ======= CONFIG / DETECÇÃO DE API_URL ======= */
let API_URL;
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
  API_URL = "http://localhost:3000";
} else if (window.location.hostname.includes("tunnelmole.net")) {
  API_URL = `https://${window.location.hostname}`;
} else {
  API_URL = "https://chamada-online.onrender.com";
}
console.log("Backend conectado em:", API_URL);

/* ======= PIN (config.js deve definir window.CONFIG.PIN) ======= */
const PIN = window.CONFIG && window.CONFIG.PIN;
if (PIN) {
  const input = prompt("Digite o PIN do Professor:");
  if (input !== PIN) {
    alert("PIN incorreto. Voltando à página inicial...");
    window.location.href = "index.html";
  }
}

/* ======= FUNÇÕES DE INTERFACE ======= */
function showMessage(text) {
  const el = document.getElementById("saida");
  if (el) el.innerText = text;
}

function ensureQrImg() {
  let img = document.getElementById("qrcode-img");
  const container = document.getElementById("qrcode-container");
  if (!img) {
    img = document.createElement("img");
    img.id = "qrcode-img";
    container.appendChild(img);
  }
  return img;
}

function showSavedQr() {
  const ultimo = localStorage.getItem("ultimoQRCode");
  if (ultimo) {
    const img = ensureQrImg();
    img.src = ultimo;
    img.alt = "QR Code para alunos";
    img.style.display = "block";
    document.getElementById("qrcode-container").style.display = "block";
  } else {
    document.getElementById("qrcode-container").style.display = "none";
  }
}

function toggleQrCode() {
  const container = document.getElementById("qrcode-container");
  container.style.display = container.style.display === "none" ? "block" : "none";
}

function showLoader() { const l = document.getElementById("loader"); if (l) l.style.display = "block"; }
function hideLoader() { const l = document.getElementById("loader"); if (l) l.style.display = "none"; }

/* ======= FUNÇÕES PRINCIPAIS ======= */
async function verLista() {
   const callId = localStorage.getItem("callIdProfessor");
    if (!callId) {
    showMessage("Nenhuma lista ativa.");
    hideLoader();
    return;
}
  showLoader();
  const ul = document.getElementById("lista-alunos");
  ul.innerHTML = "";
  try {
    const res = await fetch(`${API_URL}/lista/${callId}`);
    const data = await res.json();
    
    mostrarLista(data);
  } catch (err) {
    console.error("Erro ao atualizar lista:", err);
    showMessage("Erro ao atualizar lista. Veja console.");
  } finally {
    hideLoader();
  }
}

async function criarLista() {
  const confirmar = confirm("Tem certeza que deseja criar uma nova lista? Isso encerrará a lista atual e criará uma nova.");
  if (!confirmar) return;

  const limite = document.getElementById("limite").value;
  const duracao = document.getElementById("duracao").value;
  

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const latitude = pos.coords.latitude;
    const longitude = pos.coords.longitude;

    try {
      const res = await fetch(`${API_URL}/criar-lista/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limite, duracao, latitude, longitude })
      });

        if (!res.ok) throw new Error("Erro ao criar lista");
      
      const data = await res.json();
      showMessage(data.msg || "Lista criada.");

      localStorage.setItem("callIdProfessor", data.callId);
      showMessage(`Lista criada! Código: ${data.callId}`);

      if (data.qrCode) {
        const img = ensureQrImg();
        img.src = data.qrCode;
        img.alt = "QR Code para alunos";
        img.style.display = "block";
        document.getElementById("qrcode-container").style.display = "block";
        localStorage.setItem("ultimoQRCode", data.qrCode);
      }
    } catch (err) {
      console.error("Erro ao criar lista:", err);
      showMessage("Erro ao criar lista. Veja console.");
    }
  }, () => alert("Não foi possível obter a localização. Ative o GPS para criar a lista."));
}

async function fecharLista() {
  try {
    const callId = localStorage.getItem("callIdProfessor");
    if (!callId) {
  showMessage("Nenhuma lista ativa.");
  return;
  }
    const res = await fetch(`${API_URL}/fechar-lista/${callId}`, { method: "POST" });
    const data = await res.json();
    showMessage(data.msg || "Lista fechada.");
    localStorage.removeItem("callIdProfessor");
    document.getElementById("lista-alunos").innerHTML = "";
  } catch (err) {
    console.error("Erro ao fechar lista:", err);
    showMessage("Erro ao fechar lista. Veja console.");
  }
}

function mostrarLista(alunos) {
  const callId = localStorage.getItem("callIdProfessor");

  const ul = document.getElementById("lista-alunos");
  ul.innerHTML = "";
  if (!Array.isArray(alunos) || alunos.length === 0) {
    ul.innerHTML = "<li>Nenhum aluno presente.</li>";
    return;
  }
  alunos.forEach((aluno, i) => {
    const vez = aluno.vezes ?? 1;
    const horario = aluno.horario ?? "-";
    const grupo = aluno.grupo ?? "-";
    const li = document.createElement("li");
    li.innerText = `${i + 1}. Nome: ${aluno.nome} | Matrícula: ${aluno.matricula} | Hora: ${horario} | Local: ${grupo} | Envios: ${vez}/2`;
    ul.appendChild(li);
  });
}

/* ======= EXPORTAÇÃO ======= */
async function baixarExcel() {
  try {
    const callId = localStorage.getItem("callIdProfessor");
    const res = await fetch(`${API_URL}/lista/${callId}`);
    const data = await res.json();
    if (!data.length) { alert("Nenhum aluno presente ainda."); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Presenças");
    XLSX.writeFile(wb, "lista_de_presenca.xlsx");
  } catch (err) {
    console.error("Erro ao gerar Excel:", err);
    alert("Erro ao gerar Excel. Veja console.");
  }
}

async function baixarPDF() {
  try {
    const callId = localStorage.getItem("callIdProfessor");
    const res = await fetch(`${API_URL}/lista/${callId}`);
    const data = await res.json();
    if (!data.length) { alert("Nenhum aluno presente ainda."); return; }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Lista de Presença", 10, 10);
    doc.setFontSize(10);
    let y = 20;
    data.forEach((a, i) => {
      const linha = `${i + 1}. ${a.nome} | Matrícula: ${a.matricula} | ${a.horario ?? "-"} | ${a.grupo ?? "-"}`;
      doc.text(linha, 10, y);
      y += 8;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    doc.save("lista_de_presenca.pdf");
  } catch (err) {
    console.error("Erro ao gerar PDF:", err);
    alert("Erro ao gerar PDF. Veja console.");
  }
}

/* ======= ANIMAÇÃO DO LOADER ======= */
const logos = ["logos/EA1.png", "logos/EA2.png"];
let logoIndex = 0;
setInterval(() => {
  const loaderLogo = document.getElementById("loader-logo");
  if (loaderLogo) {
    logoIndex = (logoIndex + 1) % logos.length;
    loaderLogo.src = logos[logoIndex];
  }
}, 1500);

/* ======= INICIALIZAÇÃO ======= */
window.addEventListener("load", () => {
  showSavedQr();
  if (localStorage.getItem("callIdProfessor")) {
    verLista();
  }
});
