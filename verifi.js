const express = require("express");
const app = express();
app.use(express.json()); // for parsing application/json
const { Kafka } = require("kafkajs");
const port = 4000;

const kafka = new Kafka({
  clientId: "my-app",
  brokers: ["localhost:9092"], // Adicione os endereços dos brokers do seu Kafka aqui
});

const consumer = kafka.consumer({ groupId: "test-group" });

function validarEmail(email) {
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regexEmail.test(email);
}

function validarCPF(cpf) {
  // Remover caracteres não numéricos
  const cpfLimpo = cpf.replace(/\D/g, "");

  // Verificar se o CPF tem 11 dígitos
  if (cpfLimpo.length !== 11) {
    return false;
  }

  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cpfLimpo)) {
    return false;
  }

  // Aplicar algoritmo de validação do CPF
  let soma = 0;
  let resto;

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpfLimpo[i - 1]) * (11 - i);
  }

  resto = (soma * 10) % 11;

  if (resto === 10 || resto === 11) {
    resto = 0;
  }

  if (resto !== parseInt(cpfLimpo[9])) {
    return false;
  }

  soma = 0;

  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpfLimpo[i - 1]) * (12 - i);
  }

  resto = (soma * 10) % 11;

  if (resto === 10 || resto === 11) {
    resto = 0;
  }

  if (resto !== parseInt(cpfLimpo[10])) {
    return false;
  }

  return true;
}

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "new-users", fromBeginning: true });

  console.log("Esperando mensagens...");
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log("olá !!! dentro do consumer run");
      console.log({
        value: message.value.toString(),
      });
      console.log("Mensagem recebida", message.value.toString());
      const novoUsuario = JSON.parse(message.value.toString());
      const cpfValido = validarCPF(novoUsuario.cpf);
      const emailValido = validarEmail(novoUsuario.email);

      // Verifica a validade do CPF e do email
      if (cpfValido && emailValido) {
        console.log("Usuário válido");
      } else {
        console.log("Usuário inválido");
        return false;
      }
    },
  });
};

run().catch(console.error);

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
