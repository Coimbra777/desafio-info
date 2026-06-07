import "dotenv/config";
import { DataSource } from "typeorm";
import { validateEnv } from "../config/validation.config";
import { User } from "../modules/users/entities/user.entity";

validateEnv(process.env);

export default new DataSource({
  type: "mssql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User],
  migrations: ["src/database/migrations/*.ts"],
  synchronize: false,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
  },
});
