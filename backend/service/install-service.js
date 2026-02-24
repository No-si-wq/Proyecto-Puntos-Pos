const Service = require("node-windows").Service;
const path = require("path");

const svc = new Service({
  name: "Puntos Backend",
  description: "Servicio Backend de Puntos Sales",
  script: path.join(__dirname, "..", "dist", "server.js"),
});

svc.on("install", () => {
  console.log("Servicio backend instalado");
  svc.start();
});

svc.on("alreadyinstalled", () => {
  console.log("Servicio backend ya estaba instalado");
});

svc.on("error", (err) => {
  console.error("Error instalando servicio backend:", err);
  process.exit(1);
});

svc.install();