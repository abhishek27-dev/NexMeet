const mongoose = require("mongoose");

const blacklistTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: [true, "token is required to be added in blacklist"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // 86400 seconds = 24 hours (token automatically deleted by MongoDB)
  },
});

const tokenBlacklistModel = mongoose.model(
  "blacklistTokens",
  blacklistTokenSchema
);

module.exports = tokenBlacklistModel;
