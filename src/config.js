module.exports = {
  env: process.env.NODE_ENV || "development",
  appPort: process.env.PORT || "2000",
  wwDbUri: process.env.WW_DB_URI || "",
  awsDB: process.env.AWS_DB_URI || "",
  ex2DB: process.env.EX2_DB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "",
  refreshSecret: process.env.REFRESH_SECRET || "",
};
