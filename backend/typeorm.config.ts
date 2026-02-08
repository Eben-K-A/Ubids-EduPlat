import "reflect-metadata";
import "dotenv/config";
import { DataSource } from "typeorm";
import { dataSourceOptions } from "./src/database/typeorm.config";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for migrations");
}

export default new DataSource(dataSourceOptions(databaseUrl));
