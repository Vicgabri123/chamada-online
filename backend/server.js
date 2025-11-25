const express = require("express");
const cors = require("cors");
const QRCode = require("qrcode");
const app = express();

app.use(cors());
app.use(express.json());

let listaAberta = false;
let presencas = [];
let referenciaSala = null;
let limiteAlunos = 0;
let duracaoHoras = 0;

// Função para calcular distância usando fórmula de haversine
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) *
      Math.cos(lat2 * rad) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Criar lista
app.post("/criar-lista", async (req, res) => {
  const { limite, duracao, latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res
      .status(400)
      .json({ msg: "Localização da sala não recebida." });
  }

  listaAberta = true;
  presencas = [];
  limiteAlunos = Number(limite);
  duracaoHoras = Number(duracao);

  referenciaSala = { latitude, longitude };

  const qrCodeData = await QRCode.toDataURL(
    "https://sua-url.com/aluno.html"
  );

  res.json({
    msg: `Lista criada com limite de ${limiteAlunos} alunos e duração de ${duracaoHoras} horas.`,
    qrCode: qrCodeData,
    referenciaSala,
  });
});

// Fechar lista
app.post("/fechar-lista", (req, res) => {
  listaAberta = false;
  res.json({ msg: "Lista fechada.", alunos: presencas });
});

// Registrar presença
app.post("/presenca", (req, res) => {
  const horario = new Date().toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour12: false,
  });

  const {
    nome,
    matricula,
    latitude,
    longitude,
    deviceId,
    justificativa,
  } = req.body;

  if (!nome) return res.json({ msg: "Nome é obrigatório!" });
  if (!matricula)
    return res.json({ msg: "Matrícula é obrigatória!" });
  if (!deviceId)
    return res.json({
      msg: "Identificador do dispositivo é obrigatório!",
    });

  // Se NÃO tem localização → exigir justificativa
  if (latitude == null || longitude == null) {
    if (justificativa && justificativa.trim() !== "") {
      if (presencas.some((a) => a.deviceId === deviceId)) {
        return res.json({
          msg: "Este dispositivo já registrou presença.",
          exigirJustificativa: false,
        });
      }

      presencas.push({
        nome,
        matricula,
        horario,
        grupo: "Justificado",
        justificativa,
        deviceId,
      });

      return res.json({
        msg: `Presença registrada com justificativa às ${horario}`,
        exigirJustificativa: false,
      });
    }

    return res.json({
      msg: "Localização não encontrada. Forneça uma justificativa.",
      exigirJustificativa: true,
    });
  }

  // COM localização → calcular distância
  const distancia = calcularDistancia(
    referenciaSala.latitude,
    referenciaSala.longitude,
    latitude,
    longitude
  );

  let grupo = "Interno";
  if (distancia >= 800) {
    grupo = "Externo";
  }

  // Evitar duplicidade
  if (presencas.some((a) => a.deviceId === deviceId)) {
    return res.json({
      msg: "Este dispositivo já registrou presença.",
      exigirJustificativa: false,
    });
  }

  presencas.push({
    nome,
    matricula,
    horario,
    grupo,
    distancia,
    latitude,
    longitude,
    deviceId,
  });

  res.json({
    msg: `Presença registrada às ${horario}`,
    distancia,
    grupo,
  });
});

// Estado da lista
app.get("/status-lista", (req, res) => {
  res.json({
    listaAberta,
    limiteAlunos,
    duracaoHoras,
    referenciaSala,
    presencas,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Servidor rodando na porta ${PORT}`)
);
