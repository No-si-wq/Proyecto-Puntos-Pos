const Service = require("node-windows").Service;
const path = require("path");

const svc = new Service({
  name: "Puntos Backend",
  script: path.join(__dirname, "..", "dist", "server.js"),
});

svc.on("uninstall", () => {
  console.log("Servicio backend eliminado correctamente");
});

svc.on("alreadyuninstalled", () => {
  console.log("Servicio backend no estaba instalado");
});

svc.on("uninstall", () => {
  console.log("Servicio backend eliminado");
  process.exit(0);
});

svc.uninstall();