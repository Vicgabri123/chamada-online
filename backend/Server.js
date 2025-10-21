const express = require("express");
const cors = require("cors");
const app = express();
const QRCode = require("qrcode");

app.use(cors());
app.use(express.json());
app.use(express.static("../Frontend"));

let listaAberta = false;
let limite = 0;
let expiresAt = null;
let presencas = []; // { nome, horario, latitude, longitude, vezes }
let referenciaSala = null;

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
app.post("/criar-lista", (req, res) => {
  const { limite: limiteInput, duracao, latitude,longitude } = req.body;
  limite = parseInt(limiteInput);
  presencas = [];
  listaAberta = true;
  expiresAt = Date.now() + (parseInt(duracao) * 60 * 60 * 1000);
  referenciaSala = { latitude, longitude };
  const horario = new Date().toLocaleTimeString();

  const alunoUrl = "https://meuchamada.netlify.app/";

  QRCode.toDataURL(alunoUrl, (err, qrCodeData) => {
    if (err) {
      console.error("Erro ao gerar QR Code", err);
      return res.status(500).json({ msg: "Erro ao gerar QR Code" });
      
    }

  res.json({ msg: `Lista criada com limite de ${limite} alunos e duração de ${duracao} horas.` ,
  qrCode: qrCodeData});
  
});
});
// Fechar lista
app.post("/fechar-lista", (req, res) => {
  listaAberta = false;
  res.json({ msg: "Lista fechada.", alunos: presencas });
});

// Registrar presença
app.post("/presenca", (req, res) => {
  const horario = new Date().toLocaleTimeString();
  if (!listaAberta) {
    return res.json({ msg: "Nenhuma lista aberta no momento." });
  }

  if (Date.now() > expiresAt) {
    listaAberta = false;
    return res.json({ msg: "O tempo da lista acabou! Aguarde a próxima chamada." });
  }

  const { nome, matricula, latitude, longitude, deviceId } = req.body;
  if (!nome) return res.json({ msg: "Nome é obrigatório!" });
  if (!matricula) return res.json({ msg: "matricula é obrigatório!" });
  if (!deviceId) return res.json({ msg: "Identificador do dispositivo é obrigatório!" });
  if (latitude == null || longitude == null) {
    return res.json({ msg: "Localização não encontrada. Ative seu GPS." });
  }

    // Check if this device has already registered
  let deviceAlreadyUsed = presencas.some(a => a.deviceId === deviceId);
  if (deviceAlreadyUsed) {
    return res.json({ msg: "Este dispositivo já registrou presença." });
  }
   
  if (!referenciaSala) {
    referenciaSala = { latitude, longitude };
  }

  let grupo = "Externo";
  const distancia = calcularDistancia(
    referenciaSala.latitude,
    referenciaSala.longitude,
    latitude,
    longitude
  );
  if (distancia <= 500) {
    grupo = "Sala";
  }

  let aluno = presencas.find(a => a.matricula === matricula);
  if (aluno) {
    return res.json({ msg: `Matrícula ${matricula} já registrou presença.` });
  }



  if (!aluno) {
    if (presencas.length >= limite) {
      return res.json({ msg: "Limite de alunos atingido." });
    }
    aluno = { nome, matricula, horario, vezes: 0, deviceId, grupo };
    presencas.push(aluno);
  }

  if (aluno.vezes >= 2) {
    return res.json({ msg: "Você já registrou presença 2 vezes." });
  }

  aluno.vezes++;
  res.json({ msg: `${nome} ${matricula} registrado com sucesso às ${horario} | Grupo: ${grupo} (${aluno.vezes}/2)` });
});

// Rota para o professor ver a lista
app.get("/lista", (req, res) => {
  res.json(presencas);
});

app.listen(3000, () => console.log("http://localhost:3000/"));

// Nota: Use Node.js para rodar este servidor. Comando: node backend/Server.js
// Certifique-se de ter o Express instalado: npm install express cors
// Acesse o frontend em: http://localhost:3000/Professor.html
// Acesse o frontend do aluno em: http://localhost:3000/Aluno.html
// Use ferramentas como Postman ou Insomnia para testar as rotas POST.no