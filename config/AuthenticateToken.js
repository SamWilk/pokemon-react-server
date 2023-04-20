const jwt = require("jsonwebtoken");
require("dotenv").config();

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

module.exports = authenticateToken;
