
async function logger(msg = "", funcName = "", error = "", resp = " ") {
    console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" })}] `, funcName, " ", msg, " ", error, " ", resp);
}
module.exports = { logger }