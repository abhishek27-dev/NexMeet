const jwt = require("jsonwebtoken");
const tokenBlacklistModel = require("../models/blacklist.model");

/**
 * @name authUser
 * @description Verifies JWT from cookie or Authorization header, and checks against blacklistTokens
 */
async function authUser(req, res, next) {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      message: "Authentication required. Please login.",
    });
  }

  const isTokenBlacklisted = await tokenBlacklistModel.findOne({
    token,
  });

  if (isTokenBlacklisted) {
    return res.status(401).json({
      message: "token is invalid",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "nexmeet_jwt_secret_key_secure_2026"
    );

    req.user = decoded;
    req.token = token;

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid token.",
    });
  }
}

module.exports = { authUser };
