const jwt = require("jsonwebtoken");
const verifyTokenAdmin = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(403).json({
      message: "No token provided.",
    });
  }
  let access_token = token.split(" ");
  access_token = access_token[1];

  jwt.verify(access_token, process.env.ADMIN_ACCESS_TOKEN, (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to authenticate token.",
      });
    }
    req.user = result;
    console.log((req.user = result));
    next();
  });
};

module.exports = verifyTokenAdmin;
