# 📘 Manual do Sistema de Chamada Online

## 📌 Descrição
Este projeto é um sistema simples de **chamada online** para salas de aula.  
O professor cria uma lista de presença, gera um **QR Code** e os alunos escaneiam para registrar sua presença.  

O sistema garante:
- Controle de limite de alunos
- Registro com **Matrícula (única)** e Nome
- Captura de horário e localização aproximada
- Limite de tempo para listas (ex: 24h)
- Proteção contra duplicidade de registros

---

## 📂 Estrutura de Pastas
```
Projeto/
│
├── Backend/
│   └── server.js     # Servidor Node.js com Express
│
├── Frontend/
│   ├── Professor.html # Interface do professor
│   ├── Aluno.html     # Interface do aluno
│   ├── style.css      # Estilo global
│   └── script.js      # Lógica de frontend (separado, opcional)
│
└── MANUAL.md          # Documentação do projeto
```

---

## 🛠️ Tecnologias usadas
- **Node.js** (backend)
- **Express.js** (servidor HTTP)
- **Tunnelmole** (exposição online gratuita)
- **HTML/CSS/JS** (frontend puro)
- **qrcode** (geração do QR Code)

---

## ▶️ Como rodar o projeto

### 1. Instale as dependências
Na pasta `Backend`:
```bash
npm install
```

### 2. Inicie o servidor
```bash
node server.js
```

### 3. Exponha para a internet (Tunnelmole)
```bash
tmole 3000
```

O Tunnelmole gera um link público do tipo:
```
https://abc123.tunnelmole.net
```

---

## 📱 Fluxo de Uso

### Professor
1. Acesse `Professor.html`
2. Defina **número máximo de alunos** e **duração da lista**
3. Clique em **Criar Lista**
4. O QR Code será exibido
5. Use **Atualizar Lista** para ver presenças em tempo real
6. Clique em **Fechar Lista** quando terminar

### Aluno
1. Escaneia o QR Code
2. Acessa `Aluno.html`
3. Informa **Matrícula** e **Nome**
4. Clica em **Enviar Presença**
5. Recebe confirmação: `Presença registrada [Nome]`

---

## ⚠️ Observações
- O Tunnelmole precisa estar ativo para alunos externos acessarem.
- Se o túnel for fechado, o link público deixa de funcionar.
- Cada servidor só mantém **uma lista ativa por vez**.
- Para suportar múltiplos professores/listas, seria necessário banco de dados.

---

## 🚀 Melhorias futuras
- Suporte a múltiplos professores
- Persistência em banco de dados
- Deploy em nuvem (Heroku, Render, Railway)
- Login com autenticação para professor/aluno
- Relatórios em PDF ou Excel
