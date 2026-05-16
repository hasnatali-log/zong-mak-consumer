const mongoose = require("mongoose");
const crypto = require("crypto");
const { env, wwDbUri } = require("../config");

if (typeof global.crypto === "undefined") {
  global.crypto = crypto;
}
if (typeof globalThis.crypto === "undefined") {
  globalThis.crypto = global.crypto;
}

//Create new mongodb instance to connect with IBM DB
const mongoInstance = mongoose.createConnection(wwDbUri, {
});

if (env === "development") {
  mongoose.set("debug", true);
}

//Conection - Sucess with Mongoose
mongoInstance.on("open", () => {
  console.log([new Date()], "connection to ww db is established");
});

mongoInstance.on("reconnected", () => {
  console.log([new Date()], "connection reestablished to ww db ..");
});

mongoInstance.on("disconnected", () => {
  console.log([new Date()], "connecting to ww db ..");
});

//Conection - Failed with Mongoose
mongoInstance.on("error", (error) => {
  console.log(
    [new Date()],
    "facing error while connecting to ww db.\nError Stack: ",
    error
  );
});

module.exports = mongoInstance;
