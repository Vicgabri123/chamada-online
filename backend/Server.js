const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static("../Frontend"))

let listaAberta = false; // controla se a lista está aberta ou fechada
let limite = 0;          // limite de alunos
let presencas = [];      // array de alunos com { nome, vezes }

app.post("/criar-lista", (req, res) => {
  limite = req.body.limite;
  lista = []; // zera lista anterior
  listaAberta = true;
  res.json({ msg: `Lista criada com limite de ${limite} alunos.`, alunos: presencas });
});

app.post("/fechar-lista", (req, res) => {
  listaAberta = false;
  res.json({ msg: "Lista fechada.", alunos: presencas });
});

// Registrar presença
app.post("/presenca", (req, res) => {
  if (!listaAberta) {
    return res.json({ msg: "Nenhuma lista aberta no momento." });
  }

  const { nome } = req.body;
  if (!nome) return res.json({ msg: "Nome é obrigatório!" });

  // Procurar se já existe o aluno na lista
  let aluno = presencas.find(a => a.nome === nome);

  if (!aluno) {
    // Novo aluno
    if (presencas.length >= limite) {
      return res.json({ msg: "Limite de alunos atingido." });
    }
    aluno = { nome, vezes: 0 };
    presencas.push(aluno);
  }

  if (aluno.vezes >= 2) {
    return res.json({ msg: "Você já registrou presença 2 vezes." });
  }

  aluno.vezes++;
  res.json({ msg: `Presença registrada (${aluno.vezes}/2).` });
});

// Rota para o professor ver a lista
app.get("/lista", (req, res) => {
  res.json(presencas);
});

app.listen(3000, () => console.log("http://localhost:3000/"));