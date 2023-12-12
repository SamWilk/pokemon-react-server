const express = require("express");
const app = express();
const cors = require("cors");
const os = require("os");
const dns = require("dns");
require("dotenv").config();

app.use(express.json());
app.use(cors());

const pokemon = require("./routes/pokemon");
const users = require("./routes/users");

const { networkInterfaces } = require("os");
const nets = networkInterfaces();
const results = []; // Or just '{}', an empty object

app.get("/", (req, res) => res.send("Pokemon-react-Server is running"));
app.use(pokemon);
app.use(users);

app.listen(3000, "0.0.0.0", () => {
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      const familyV4Value = typeof net.family === "string" ? "IPv4" : 4;
      if (net.family === familyV4Value && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results.push(net.address);
      }
    }
  }
  console.log(`About-me-server running on port http://${results.pop()}:3000`);
});

module.exports = app;
