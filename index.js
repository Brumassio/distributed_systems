const express = require("express");
const app = express();
const port = 3000;
const { Kafka } = require("kafkajs");

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

app.use(express.json()); // for parsing application/json

app.get("/users", (req, res) => {
  res.json(
    prisma.user.findMany({
      select: {
        nome: true,
        email: true,
        cpf: true,
      },
    })
  );
});

//configurando o kafka
const kafka = new Kafka({
  clientId: "my-app",
  brokers: ["localhost:9092"],
});

const producer = kafka.producer();

app.post("/users/novo", async (req, res) => {
  const dados = await req.body;
  const novoUsuario = {
    nome: dados.nome,
    email: dados.email,
    cpf: dados.cpf,
  };
  const verifiUsuarioJaexiste = await prisma.user.findFirst({
    where: {
      OR: [
        {
          cpf: novoUsuario.cpf,
        },
        {
          email: novoUsuario.email,
        },
      ],
    },
  });
  if (verifiUsuarioJaexiste) {
    return res.status(400).send("Usuário já cadastrado");
  }
  // Envia uma mensagem para o tópico "new-users"
  await producer.send({
    topic: "new-users",
    messages: [{ value: JSON.stringify(novoUsuario) }],
  });

  await prisma.user.create({
    data: {
      nome: novoUsuario.nome,
      email: novoUsuario.email,
      cpf: novoUsuario.cpf,
    },
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
