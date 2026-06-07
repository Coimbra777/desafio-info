import "dotenv/config";
import { DataSource } from "typeorm";
import { validateEnv } from "../config/validation.config";
import { Model } from "../modules/models/entities/model.entity";
import { User } from "../modules/users/entities/user.entity";
import { Vehicle } from "../modules/vehicles/entities/vehicle.entity";

validateEnv(process.env);

export default new DataSource({
  type: "mssql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User, Model, Vehicle],
  migrations: ["src/database/migrations/*.ts"],
  synchronize: false,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
  },
});
