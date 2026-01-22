const express = require("express");
const cors = require("cors");
const app = express();
const QRCode = require("qrcode");
const path = require("path");
const crypto = require("crypto");


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend"))); // 👈 Serve todos os arquivos da pasta frontend

const FRONTEND_URL = "http://localhost:3000";


const chamadas = {};

function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // raio da Terra em metros
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // distância em metros
}

// Criar lista
app.post("/criar-lista", async (req, res) => {
  const { limite: limiteInput, duracao, latitude,longitude } = req.body;

  if (!latitude || !longitude) {
    return res.json({ msg: "Localização do professor é obrigatória." });
  }
  
  const callId = crypto.randomUUID();
  
  const limite = parseInt(limiteInput);
  const expiresAt = Date.now() + (parseInt(duracao) * 60 * 60 * 1000);

  chamadas[callId] = {
  presencas: [],
  limite,
  expiresAt,
  listaAberta: true,
  referenciaSala: { latitude, longitude },
  criadaEm: Date.now()
}
  const horario = new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" });

  const alunoUrl = `${req.protocol}://${req.get("host")}/aluno.html?callId=${callId}`;

try{
   const qrCodeData = await QRCode.toDataURL(alunoUrl);

    return res.json({
      msg: `Lista criada com limite de ${limite} alunos e duração de ${duracao} horas.`,
      qrCode: qrCodeData,
      callId
    });
  } catch (err) {
    console.error("Erro ao gerar QR Code", err);
    return res.status(500).json({ msg: "Erro ao gerar QR Code" });
  }
});
// Fechar lista
app.post("/fechar-lista", (req, res) => {
  const { callId } = req.body;

  if (!chamadas[callId]) {
    return res.json({ msg: "Chamada não encontrada." });
  }

  chamadas[callId].listaAberta = false;
  
  res.json({ msg: "Lista fechada.", alunos: chamadas[callId].presencas});
});

// Registrar presença
app.post("/presenca", (req, res) => {
   const {
    callId,
    nome,
    matricula,
    latitude,
    longitude,
    deviceId,
    justificativa
  } = req.body;
  
  const horario = new Date().toLocaleTimeString("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour12: false
});

   // Verificar chamada
   const chamada = chamadas[callId];
    if (!chamada) {
    return res.json({ msg: "Chamada inválida ou encerrada." });
  }

  if (!chamada.listaAberta) {
    return res.json({ msg: "Nenhuma lista aberta no momento." });
  }

  if (Date.now() > chamada.expiresAt) {
    listaAberta = false;
    return res.json({ msg: "O tempo da lista acabou! Aguarde a próxima chamada." });
  }
  // Validações básicas
  if (!nome) return res.json({ msg: "Nome é obrigatório!" });
  if (!matricula) return res.json({ msg: "matricula é obrigatório!" });
  if (!deviceId) return res.json({ msg: "Identificador do dispositivo é obrigatório!" });

  // Nome só letras
if (!/^[A-Za-zÀ-ÿ\s]+$/.test(nome)) {
  return res.json({ msg: "O nome deve conter apenas letras." });
}

// Matrícula só números
if (!/^\d+$/.test(matricula)) {
  return res.json({ msg: "A matrícula deve conter apenas números." });
}


    const deviceAlreadyUsed = presencas.some(a => a.deviceId === deviceId);
  if (deviceAlreadyUsed) {
    return res.json({ msg: "Este dispositivo já registrou presença." });
  }
   
  
 // Sem localização → justificativa
  if ((latitude == null || longitude == null)) {
    if (!justificativa || justificativa.trim() === "") {
      return res.json({ msg: "Localização não encontrada. Informe uma justificativa." });
    }
     chamada.presencas.push({
      nome,
      matricula,
      horario,
      grupo: "Justificado",
      justificativa,
      deviceId
    });
    return res.json({ msg: `Presença registrada com justificativa às ${horario}` });
  } else {
    return res.json({ msg: "Localização não encontrada. Ative seu GPS ou forneça uma justificativa." });
  }
}

    // Check if this device has already registered

  // Calcular grupo
  const distancia = calcularDistancia(
    chamada.referenciaSala.latitude,
    chamada.referenciaSala.longitude,
    latitude,
    longitude
  );
  
const grupo = distancia <= 2500 ? "Interno" : "Externo";

// Verificar matrícula duplicada
const alunoJaExiste = chamada.presencas.some(
  a => a.matricula === matricula
);

  if (alunoJaExiste) {
  return res.json({ msg: `Matrícula ${matricula} já registrou presença.` });
}
  if (chamada.presencas.length >= chamada.limite) {
      return res.json({ msg: "Limite de alunos atingido." });
    }

  // Registrar presença
  chamada.presencas.push({
  nome,
  matricula,
  horario,
  grupo,
  justificativa: "",
  deviceId
  });

return res.json({
  msg: `${nome} registrado com sucesso às ${horario} | Grupo: ${grupo}`
});

// Rota para o professor ver a lista
app.get("/lista", (req, res) => {
  const { callId } = req.params;

  if (!chamadas[callId]) {
    return res.json({ msg: "Chamada não encontrada." });
  }

  return res.json(chamadas[callId].presencas);
});

//app.get("/admin/chamadas", (req, res) => {
//  const todasChamadas = Object.entries(chamadas).map(([callId, chamada]) => ({
//    callId,
//    aberta: chamada.listaAberta,
//    criadaEm: chamada.criadaEm,
//    expiresAt: chamada.expiresAt,
 //   totalPresencas: chamada.presencas.length,
 //   referenciaSala: chamada.referenciaSala
//  }));

//  res.json(todasChamadas);
//});

app.get("/",(req, res) =>{
  res.sendFile(path.join(__dirname, "../frontend/index.html"));;
}
)

app.listen(3000, () => console.log("Servidor rodando na porta 3000 http://localhost:3000/"));


// Nota: Use Node.js para rodar este servidor. Comando: node backend/Server.js
// Certifique-se de ter o Express instalado: npm install express cors
// Acesse o frontend em: http://localhost:3000/Professor.html
// Acesse o frontend do aluno em: http://localhost:3000/Aluno.html
// Use ferramentas como Postman ou Insomnia para testar as rotas POST.no
