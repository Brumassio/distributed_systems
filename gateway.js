const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const port = 5000;

// Lista de URLs dos serviços replicados
const serviceUrls = ["http://localhost:3000", "http://localhost:4000"];

// Índice atual para balanceamento de carga
let currentServiceIndex = 0;

// Configurar proxy para rotear solicitações para os serviços replicados
app.use(
  "/",
  createProxyMiddleware({
    target: serviceUrls[currentServiceIndex], // Iniciar com o primeiro serviço
    changeOrigin: true,
    onError: (err, req, res) => {
      // Lidar com erros de comunicação com o serviço
      console.error("Error communicating with service:", err.message);
      // Tentar redirecionar a solicitação para outro serviço
      const nextServiceIndex = (currentServiceIndex + 1) % serviceUrls.length;
      currentServiceIndex = nextServiceIndex;
      console.log(
        "Redirecting request to next service:",
        serviceUrls[nextServiceIndex]
      );
      req.url = req.originalUrl; // Restaurar a URL original
      createProxyMiddleware({
        target: serviceUrls[nextServiceIndex],
        changeOrigin: true,
      })(req, res);
    },
  })
);

// Atualizar o índice de serviço atual após cada solicitação
app.use((req, res, next) => {
  currentServiceIndex = (currentServiceIndex + 1) % serviceUrls.length;
  next();
});

app.listen(port, () => {
  console.log(`API Gateway running on http://localhost:${port}`);
});
