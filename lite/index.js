const express = require("express");
const path = require("path");
const app = express();
const fs = require("fs");
const opn = require("opn");

(async () => {
  const config = JSON.parse(await fs.readFileSync("./config.json"));
  app.use(express.static(path.join(__dirname + "/build")));

  app.get("/", async (req, res) => {
    const file = await fs.readFileSync(__dirname + "/build/index.html");
    console.log(file);
    res.sendFile(path.join("./build/index.html"));
  });

  app.get("/bootstrap", (req, res) => {
    res.json({
      bootstrap_peers: config.bootstrap_peers,
      db_address: config.db_address
    });
  });

  app.listen(config.server_port, "0.0.0.0");
  console.log(`listening on 0.0.0.0:${config.server_port}`);
  opn(`http://0.0.0.0:${config.server_port}`);
})();
