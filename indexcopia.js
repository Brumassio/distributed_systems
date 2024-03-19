const express = require("express");
const cluster = require("cluster");
const os = require("os");
const { Kafka } = require("kafkajs");
const { PrismaClient } = require("@prisma/client");

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  const app = express();
  const port = 6000;
  const prisma = new PrismaClient();
  console.log("teste");
  app.use(express.json());

  app.get("/users", async (req, res) => {
    try {
      const users = await prisma.user.findMany();
      if (users.length === 0) {
        return res.status(404).json({ message: "Nenhum usuário encontrado" });
      }
      res.status(200).json(users);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  // Configurar o Kafka
  const kafka = new Kafka({
    clientId: "my-app",
    brokers: ["localhost:9092"],
  });

  const producer = kafka.producer();
  producer.connect();

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
      return res
        .status(400)
        .send("Usuário já cadastrado, email ou cpf já existente");
    }
    console.log("Enviando mensagem para o Kafka");
    console.log(novoUsuario);
    // Enviar uma mensagem para o tópico "new-users"
    try {
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
      return res.status(201).send("Usuário cadastrado com sucesso");
    } catch (e) {
      console.error(e);
      return res.status(500).send("Erro ao enviar mensagem para o Kafka");
    }
  });

  app.listen(port, () => {
    console.log(`Worker ${cluster.worker.id} listening on port ${port}`);
  });
}
