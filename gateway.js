const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const port = 5000;

// Lista de URLs dos serviços replicados
const serviceUrls = ["http://localhost:3000", "http://localhost:6000"];

// Índice atual para balanceamento de carga
let currentServiceIndex = 0;

// Configurar proxy para rotear solicitações para os serviços replicados
app.use((req, res, next) => {
  // Defina o destino da solicitação com base no índice atual
  const targetUrl = serviceUrls[currentServiceIndex];
  // Crie o middleware do proxy

  const proxyMiddleware = createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    onError: (err, req, res) => {
      console.error("Error communicating with service:", err.message);
      // Tentar redirecionar a solicitação para outro serviço
      const nextServiceIndex = (currentServiceIndex + 1) % serviceUrls.length;
      currentServiceIndex = nextServiceIndex;
      console.log(
        "Redirecting request to next service:",
        serviceUrls[nextServiceIndex]
      );
      // Chame next() para passar o controle para o próximo middleware na pilha
      next();
    },
  });
  // Execute o middleware do proxy
  proxyMiddleware(req, res, next);
});

// Atualizar o índice de serviço atual após cada solicitação
app.use((req, res, next) => {
  currentServiceIndex = (currentServiceIndex + 1) % serviceUrls.length;
  next();
});

app.listen(port, () => {
  console.log(`API Gateway running on http://localhost:${port}`);
});
