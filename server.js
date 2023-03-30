const express = require("express");
const app = express();
const { Pool } = require("pg");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { v4 } = require("uuid");
const jwt = require("jsonwebtoken");
require("dotenv").config();

app.use(express.json());
app.use(cors());

const pool = new Pool({
  user: "admin",
  host: "10.221.4.188",
  database: "pt",
  password: "admin",
  port: "5050",
});

app.get("/pokemon", async (request, response) => {
  const query = {
    text: ` select *
        from pokemon
        order by pokemon.id`,
  };
  pool.query(query, (err, res) => {
    if (err) {
      console.error(err);
      console.log("No Pokemon Found");
      response.status(400).send();
    } else {
      response.send(res.rows);
    }
  });
});

app.get("/users/pokemon", authenticateToken, async (request, response) => {
  const currentUser = request.user;
  const query = {
    text: `
    select pf.pokemonid
    from pokemonflag pf
    join users u on u.id = pf.userid
    where u.id = $1
    `,
    values: [currentUser.userID],
  };
  pool.query(query, (err, res) => {
    if (err) return response.status(400).send("Issue");
    response.status(200).send(res.rows);
  });
});

app.post("/users/pokemon", authenticateToken, async (request, response) => {
  const currentUser = request.user;
  const checkQuery = {
    text: `
    select *
    from pokemonflag pf
    where pf.userid = $1
    and pf.pokemonid = $2
    `,
    values: [currentUser.userID, request.body.pokemonid],
  };
  pool.query(checkQuery, (err, res) => {
    if (err) return response.status(400).send();
    if (res.rowCount !== 0) {
      response.status(403).send("Poke-flag already created");
    } else {
      const query = {
        text: `
        insert into pokemonflag (pokemonid, userid)
        values ($1, $2)
        `,
        values: [request.body.pokemonid, currentUser.userID],
      };
      pool.query(query, (err, res) => {
        if (err) {
          return response.status(400).send("Issue");
        }
        response.status(201).send("Flag Created");
      });
    }
  });
});

app.delete("/users/pokemon", authenticateToken, async (request, response) => {
  const currentUser = request.user;
  const query = {
    text: `
    delete from pokemonflag pf
    where pf.pokemonid = $1
    and pf.userid = $2
    `,
    values: [request.body.pokemonid, currentUser.userID],
  };
  pool.query(query, (err, res) => {
    if (err) response.status(400).send();
  });
  response.status(202).send("Flag removed");
});

app.get("/pokemon/gen/", async (request, response) => {
  const query = {
    text: ` select *
        from pokemon p
        where p.generation = $1
        order by p.id asc`,
    values: [request.body.generation],
  };
  pool.query(query, (err, res) => {
    if (err) {
      console.error(err);
      console.log(`No Gen ${request.body.generation} found`);
      response.status(400).send();
    } else {
      response.send(res.rows);
    }
  });
});

// Will need a check to make sure users cannot use the same name
// Testing something out
app.post("/users", async (request, response) => {
  let createUserFlag = true;
  const checkNamequery = {
    text: `select * from users where name = $1 or email = $2`,
    values: [request.body.name, request.body.email],
  };
  pool.query(checkNamequery, async (err, res) => {
    if (res.rowCount >= 1) {
      createUserFlag = false;
      response.status(400).send("User already exists with username or email");
    } else {
      let password;
      const guid = v4();
      try {
        password = await bcrypt.hash(request.body.password, 10);
      } catch {
        console.log("Issue while hashing password");
      }
      const query = {
        text: `insert into users (id, name, email, password)
      values (uuid_generate_v4(), $1, $2, $3)`,
        values: [request.body.name, request.body.email, password],
      };
      pool.query(query);
      response.status(201).send("User Created");
    }
  });
});

app.get("/users/login", async (request, response) => {
  try {
    const query = {
      text: `select u.id, u.name, u.password
        from users u
        where u.name = $1`,
      values: [request.body.name],
    };
    pool.query(query, async (err, res) => {
      if (err) {
        console.error(err);
        response.status(500).send("User not found");
      }
      if (res.rowCount == 0) {
        response.status(404).send("No user found");
      } else {
        const checkUser = res.rows.pop();
        if (await bcrypt.compare(request.body.password, checkUser.password)) {
          // User has been authenticated, create JWT token
          const user = { name: checkUser.name, userID: checkUser.id };
          const accessToken = jwt.sign(user, process.env.JWT_TOKEN_ACCESS);
          response.status(200).json({ accessToken: accessToken });
        } else {
          response.status(400).send("Passwords do not match");
        }
      }
    });
  } catch (error) {
    console.log(error);
    response.status(500).send();
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.status(401);

  jwt.verify(token, process.env.JWT_TOKEN_ACCESS, (err, user) => {
    if (err) return res.status(403);
    req.user = user;
    next();
  });
}

app.listen(3000, () => {
  console.log("Server, listening on port 3000...");
});
