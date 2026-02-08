import { ConfigService } from "@nestjs/config";
import type { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { DataSourceOptions } from "typeorm";

export const typeOrmConfigFactory = (configService: ConfigService): TypeOrmModuleOptions => {
  return {
    type: "postgres",
    url: configService.get<string>("db.url"),
    autoLoadEntities: true,
    synchronize: false,
    logging: false,
    migrationsRun: false,
    migrations: ["dist/database/migrations/*.js"],
    extra: {
      max: 50
    }
  };
};

export const dataSourceOptions = (databaseUrl: string): DataSourceOptions => ({
  type: "postgres",
  url: databaseUrl,
  synchronize: false,
  logging: false,
  migrations: ["dist/database/migrations/*.js"],
  entities: ["dist/**/*.entity.js"],
  extra: {
    max: 50
  }
});
