const express = require("express");
const app = express();
const port = 3000;
const axios = require("axios");

app.use(express.json()); // for parsing application/json

let usuarios = [];

app.get("/users", (req, res) => {
  res.json(usuarios);
});

app.post("/users/novo", (req, res) => {
  const novoUsuario = {
    nome: req.body.nome,
    email: req.body.email,
    cpf: req.body.cpf,
  };
  if (
    usuarios.find(
      (usuario) =>
        usuario.cpf === novoUsuario.cpf || usuario.email === novoUsuario.email
    )
  ) {
    return res.status(400).send("Usuário já cadastrado");
  }
  axios
    .post("http://localhost:4000/verifica", {
      email: novoUsuario.email,
      cpf: novoUsuario.cpf,
    })
    .then((response) => {
      if (!response.data) {
        return res.status(400).send("Usuário inválido");
      }
      console.log(response.data);
      console.log(response.status);
      usuarios.push(novoUsuario);
      res.status(201).send("Usuário cadastrado com sucesso!");
    })
    .catch((error) => {
      console.error(error);
      console.log(
        "Não foi possível acessar a outra API, o cadastro não foi realizado :("
      );
      res.status(500).send("Não foi possível cadastrar o usuário");
    });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
