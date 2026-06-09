import "dotenv/config";
import { DataSource } from "typeorm";
import { Brand } from "../modules/brands/entities/brand.entity";
import { Model } from "../modules/models/entities/model.entity";
import { User } from "../modules/users/entities/user.entity";
import { Vehicle } from "../modules/vehicles/entities/vehicle.entity";

export default new DataSource({
  type: "mssql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User, Brand, Model, Vehicle],
  migrations: ["src/database/migrations/*.ts"],
  synchronize: false,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
  },
});
