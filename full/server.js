const ipfs = require("ipfs");
const PeerId = require("peer-id");
const fs = require("fs");
const OrbitDB = require("orbit-db");
const express = require("express");
const bodyParser = require("body-parser");
const fileType = require("file-type");

const schema = {
  article: {
    _id: String,
    path: String, // path
    title: String,
    type: String, // article
    description: String,
    content: String,
    staticFiles: Array
  },
  folder: {
    _id: String,
    path: String,
    title: String,
    type: String
  }
};

class Node {
  constructor(config) {
    this.db = null;
    this.db_address = config.db_address;
    this.server_port = config.server_port || 3002
    this.ipfs = null;
    this.ipfs_port = config.ipfs_port;
    this.config = null;
    this.allowed_to_write = config.allowed_to_write;
    this.bootstrap_peers = config.bootstrap_peers;
    this.repo_id = config.repo_id;
  }
  async start() {
    await this.startIpfs();
    await this.startOrbit();
    await this.startServer();
  }
  startIpfs() {
    return new Promise((resolve, reject) => {
      const node = new ipfs({
        repo: `./ipfs/${this.repo_id}`,
        EXPERIMENTAL: {
          pubsub: true,
          dht: true
        },
        pass: "ggggggggggggggggggggggggggggggggg",
        config: {
          Addresses: {
            Swarm: [
              //  "/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star",
              // '/libp2p-webrtc-star/dns4/star-signal.cloud.ipfs.team/wss',
              `/ip4/127.0.0.1/tcp/${this.ipfs_port}`,
              `/ip4/0.0.0.0/tcp/${this.ipfs_port + 1}/ws`
            ]
          }
        }
      });
      node.on("error", (err, id) => {
        console.log(err);
      });
      node.on("ready", async (err, id) => {
        if (err) {
          console.log(`Error! ${err}`);
          reject(err);
        }
        const _promises = [];
        this.bootstrap_peers.forEach(item => {
          _promises.push(node.swarm.connect(item));
        });
        try {
          await Promise.all(_promises);
        } catch (e) {
          console.log(e);
        }
        this.ipfs = node;
        resolve();
      });
    });
  }
  async getOrbitKey() {
    await this.startIpfs();
    const orbitdb = new OrbitDB(this.ipfs, `./orbitdb/${this.repo_id}`);
    return await orbitdb.key.getPublic("hex");
  }
  async startOrbit() {
    const orbitdb = new OrbitDB(this.ipfs, `./orbitdb/${this.repo_id}`);
    this.orbitdb = orbitdb;
    const myaddr = await orbitdb.key.getPublic("hex");
    // If not connecting to an exsisting database
    if (this.db_address.indexOf("orbit") == -1) {
      this.db = await orbitdb.docstore(this.db_address, {
        write: [...this.allowed_to_write, myaddr]
      });
    } else {
      this.db = await orbitdb.docstore(this.db_address);
    }
    // On db write
    this.db.events.on("write", async (address, data) => {
      const payload = data.payload;
      if (payload.op == "PUT" && payload.value.type == "article") {
        // Start pinning all the static content so it doesn't get garbage collected
        const _promises = [];
        payload.value.staticFiles.forEach(file => {
          const path = file.path;
          const hash = path.slice().substr(path.lastIndexOf("/") + 1);
          _promises.push(this.ipfs.pin.add(hash));
        });
        try {
          await Promise.all(_promises);
        } catch (e) {
          console.log(`Error pinning static content ${e}`)
        }
      }
    });
    // Load the database before moving forward
    await this.db.load();
    this.db_address = this.db.address.toString();
    this.db.events.on("replicated", address => {
      console.log("Synced with new data!");
    });
  }
  async startServer() {
    // Some helper functions
    const sendError = (res, error) =>
      res.json({ response: "error", message: error });
    const sendSuccess = res => res.json({ response: "success" });
    const saveItem = async (item, res) => {
      try {
        await this.db.put(item);
        sendSuccess(res);
      } catch (e) {
        sendError(res, e.message);
      }
    };
    const server = express();
    server.use(express.static(__dirname + "/static"));
    // Since the static content is coming over JSON(base64), increase the request limit.
    server.use(bodyParser.json({ limit: "15mb" }));
    await server.set("x-powered-by", false);

    server.get("/", async (req, res) => {
      res.sendFile(__dirname + "/views/index.html");
    });
    server.post("/:type/delete", async (req, res) => {
      if (req.params.type == "folder") {
        const data = await this.db
          .get(req.body._id)
          .filter(
            e =>
              e._id.slice().split("/").length  >=
              req.body._id.split("/").length
          );
        const _promises = [];
        data.map(item => {
          // Filter to prevent folders/articles with similar names from being deleted
          // but still delete nested articles/folders
          new RegExp(`${req.body._id}/`, "g").test(item._id + "/")
            ? _promises.push(this.db.del(item._id))
            : {};
        });
        try {
          await Promise.all(_promises);
          sendSuccess(res);
        } catch (e) {
          sendError(res, e.message);
        }
      } else if (req.params.type == "article") {
        await this.db.del(req.body._id);
        sendSuccess(res);
      }
    });
    server.post("/:type/add", async (req, res) => {
      const json = req.body;
      const _res = {};
      let item;
      if (json.type == req.params.type) {
        item = {};
        for (const k in schema[json.type]) {
          item[k] = json[k];
        }
        item._id = `${json.path}${
          json.path == "/wiki/" ? "" : "/"
        }${json.title.toLowerCase().replace(/ /g, "-")}${
          json.type == "article" ? "_" : ""
        }`;
      }
      if (item) {
        // Check if an article with this id already exists
        if (
          (await this.db.get(item._id).filter(i => i._id == item._id).length) ==
          0
        ) {
          if (json.edit) {
            await this.db.del(json.edit);
          }
          saveItem(item, res);
        } else {
          // Make sure the edit doesn't overwrite an existing article as IDs are based on titles
          if (json.edit && json.edit === item._id) {
            await this.db.del(json.edit);
            saveItem(item, res);
          } else {
            sendError(
              res,
              `A ${item.type} with the title "${item.title}" already exsists`
            );
          }
        }
      } else {
        sendError(res, `Incorrect add type`);
      }
    });
    server.get(/wiki/, async (req, res) => {
      // Sanitize url if needed for any script related things
      const data = await this.db
        .get(req.url)
        .filter(
          e =>
            e._id.slice().split("/").length <= req.url.split("/").length
        );
      res.json({
        data: data
      });
    });
    // This route is basically ipfs's gateway without ipns
    server.get("/ipfs/:hash", async (req, res) => {
      // JSON conversion and back here because the promise resolves before
      // all the dict's values are assigned, and this prevents that.
      const item = JSON.parse(
        JSON.stringify(await this.ipfs.files.get(req.params.hash))
      );
      // Get buffer content type
      const contentType = fileType(Buffer.from(item[0].content.data));
      res.writeHead(200, {
        "Content-Type": contentType.mime,
        "Content-Disposition": `attachment; filename=${req.params.hash}.${
          contentType.ext
        }`,
        "Content-Length": item[0].content.data.length
      });
      // Send static file
      res.end(Buffer.from(item[0].content.data, "binary"));
    });
    server.post("/gethash", async (req, res) => {
      // Add the static file to ipfs but don't pin it,
      // this is to allow the user to get an address to use in the editor.
      // If they use it in the article, it will be pinned on db write,
      // if not, it will be garbage collected
      const path = JSON.parse(
        JSON.stringify(
          await this.ipfs.files.add(
            Buffer.from(
              // remove the header
              req.body.data.substr(req.body.data.indexOf(",") + 1),
              "base64"
            )
          )
        )
      )[0];
      res.json({
        path: `http://localhost:${
        this.server_port
        }/ipfs/${path.path}`
      });
    });
    server.listen(this.server_port, "0.0.0.0")
  }
}
(async () => {
  const config = JSON.parse(await fs.readFileSync("./config.json"));
  const t = new Node(config);
  if (process.argv[2] == "start") {
    await t.start();
    console.log(`\n
Your IPFS id: ${(await t.ipfs.id()).id}
Your orbitdb address: ${t.db_address}
Your db public key(hex): ${await t.orbitdb.key.getPublic("hex")}
The app is running on http://0.0.0.0:${t.server_port}`);
} else if (process.argv[2] == "key") {
    console.log(`
Your key is ${await t.getOrbitKey()}\n\npress ctrl-c to stop!
      `);
  } else {
    console.log('Need a parameter! Either "key" or "start"')
  }
})();
