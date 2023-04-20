const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(express.json());
app.use(cors());

const pokemon = require("./routes/pokemon");
const users = require("./routes/users");

app.get("/", (req, res) => res.send("Pokemon-react-Server is running"));
app.use(pokemon);
app.use(users);

app.listen(3000, () => {
  console.log("Server, listening on port 3000...");
});

module.exports = app;
