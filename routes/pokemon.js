const express = require("express");
const path = require("path");
const fs = require("fs");
const db = require("../config/DBContext");
const authenticateToken = require("../config/AuthenticateToken");
require("dotenv").config();

const router = express.Router();

router.get("/pokemon", async (request, response) => {
  const query = {
    text: ` select *
          from pokemon
          order by pokemon.id`,
  };
  try {
    const client = await db.connect();
    client.query(query, (err, res) => {
      if (err) {
        console.error(err);
        console.log("No Pokemon Found");
        response.status(400).send();
      } else {
        response.send(res.rows);
      }
    });
    client.release();
  } catch (error) {
    console.log(error);
  }
});

router.get("/users/pokemon", authenticateToken, async (request, response) => {
  const currentUser = request.user;
  const query = {
    text: `
      select pf.pokemonid
      from pokemonflag pf
      join users u on u.id = pf.userid
      where u.id = $1
      order by pf.pokemonid 
      `,
    values: [currentUser.userID],
  };
  try {
    const client = await db.connect();
    client.query(query, (err, res) => {
      if (err) return response.status(400).send("Issue");
      response.status(200).send(res.rows);
    });
    client.release();
  } catch (error) {
    console.log(error);
  }
});

router.get("/users/getUser", authenticateToken, async (request, response) => {
  response.status(200).send(request.user);
});

router.post("/users/pokemon", authenticateToken, async (request, response) => {
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

  try {
    const client = await db.connect();
    client.query(checkQuery, (err, res) => {
      if (err) return response.status(400).send();
      if (res.rowCount !== 0) {
        const currentUser = request.user;
        const query = {
          text: `
          delete from pokemonflag pf
          where pf.pokemonid = $1
          and pf.userid = $2
          `,
          values: [request.body.pokemonid, currentUser.userID],
        };
        try {
          client.query(query, (err, res) => {
            if (err) response.status(400).send();
          });
          response.status(202).send("Flag removed");
        } catch (error) {
          console.log(error);
          response.status(500).send("Interal Error");
        }
      } else {
        const query = {
          text: `
              insert into pokemonflag (pokemonid, userid)
              values ($1, $2)
              `,
          values: [request.body.pokemonid, currentUser.userID],
        };
        client.query(query, (err, res) => {
          if (err) {
            return response.status(400).send("Issue");
          }
          response.status(201).send("Flag Created");
        });
      }
    });
    client.release();
  } catch (error) {
    console.log(error);
  }
});

router.delete(
  "/users/pokemon",
  authenticateToken,
  async (request, response) => {
    const currentUser = request.user;
    const query = {
      text: `
      delete from pokemonflag pf
      where pf.pokemonid = $1
      and pf.userid = $2
      `,
      values: [request.body.pokemonid, currentUser.userID],
    };
    try {
      const client = await db.connect();

      client.query(query, (err, res) => {
        if (err) response.status(400).send();
      });
      response.status(202).send("Flag removed");
      client.release();
    } catch (error) {
      console.log(error);
    }
  }
);

router.get("/pokemon/gen/:generation", async (request, response) => {
  const query = {
    text: ` select *
          from pokemon p
          where p.generation = $1
          order by p.id asc`,
    values: [request.params.generation],
  };

  try {
    const client = await db.connect();

    client.query(query, (err, res) => {
      if (err) {
        console.error(err);
        console.log(`No Gen ${request.body.generation} found`);
        response.status(400).send();
      } else {
        response.send(res.rows);
      }
    });
    client.release();
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
