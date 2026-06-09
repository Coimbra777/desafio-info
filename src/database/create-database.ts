import "dotenv/config";

const mssql = require("mssql");

async function createDatabaseIfNeeded(): Promise<void> {
  const databaseName = process.env.DB_DATABASE as string;
  const escapedDatabaseName = databaseName.replace(/]/g, "]]");

  const pool = await mssql.connect({
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST as string,
    port: Number(process.env.DB_PORT),
    database: "master",
    options: {
      encrypt: process.env.DB_ENCRYPT === "true",
      trustServerCertificate:
        process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
    },
  });

  try {
    const result = await pool
      .request()
      .input("databaseName", mssql.NVarChar, databaseName)
      .query("SELECT name FROM sys.databases WHERE name = @databaseName");

    if (result.recordset.length > 0) {
      process.stdout.write(`Database "${databaseName}" already exists.\n`);
      return;
    }

    await pool.request().query(`CREATE DATABASE [${escapedDatabaseName}]`);
    process.stdout.write(`Database "${databaseName}" created.\n`);
  } finally {
    await pool.close();
  }
}

void createDatabaseIfNeeded();
