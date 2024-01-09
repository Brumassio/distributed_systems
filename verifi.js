const express = require("express");
const app = express();
app.use(express.json()); // for parsing application/json

const port = 4000;

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
}

app.post("/verifica", async (req, res) => {
  try {
    const usuario = req.body;
    const cpfValido = validarCPF(usuario.cpf);
    const emailValido = validarEmail(usuario.email);

    res.json(cpfValido && emailValido);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao obter usuários" });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
