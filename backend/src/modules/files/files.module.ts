import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FileEntity } from "./domain/file.entity";
import { FilesService } from "./application/files.service";
import { FilesController } from "./presentation/files.controller";
import { LocalStorageService } from "./application/local-storage.service";
import { S3StorageService } from "./application/s3-storage.service";
import { ConfigService } from "@nestjs/config";
import { NoopVirusScanService } from "./application/noop-virus-scan.service";

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity])],
  providers: [
    FilesService,
    LocalStorageService,
    S3StorageService,
    NoopVirusScanService,
    {
      provide: "StorageService",
      inject: [ConfigService, LocalStorageService, S3StorageService],
      useFactory: (configService: ConfigService, local: LocalStorageService, s3: S3StorageService) => {
        const driver = configService.get<string>("files.driver") || "local";
        return driver === "s3" ? s3 : local;
      }
    },
    {
      provide: "VirusScanService",
      useExisting: NoopVirusScanService
    }
  ],
  controllers: [FilesController]
})
export class FilesModule {}
