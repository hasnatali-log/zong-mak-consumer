const mongoose = require("mongoose");
const { wwDb } = require("../../../database");

const userOTP = mongoose.Schema(
  {
    otp: { type: Number },
    phone: { type: String },
    createdAt: { type: String, default: new Date() },
    retries: { type: Number, default: 0 },
    resends: { type: Number, default: 0 },
  },
  { collection: "userOTP" }
);
module.exports = wwDb.model("userOTP", userOTP);
