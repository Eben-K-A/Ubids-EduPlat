import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FileEntity } from "./domain/file.entity";
import { FilesService } from "./application/files.service";
import { FilesController } from "./presentation/files.controller";
import { LocalStorageService } from "./application/local-storage.service";
import { S3StorageService } from "./application/s3-storage.service";
import { ConfigService } from "@nestjs/config";
import { NoopVirusScanService } from "./application/noop-virus-scan.service";
import { ClamAvVirusScanService } from "./application/clamav-virus-scan.service";
import { MultipartService } from "./application/multipart.service";

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity])],
  providers: [
    FilesService,
    LocalStorageService,
    S3StorageService,
    NoopVirusScanService,
    ClamAvVirusScanService,
    MultipartService,
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
      inject: [ClamAvVirusScanService, NoopVirusScanService],
      useFactory: (clam: ClamAvVirusScanService, noop: NoopVirusScanService) => {
        return process.env.CLAMAV_HOST ? clam : noop;
      }
    }
  ],
  controllers: [FilesController]
})
export class FilesModule {}
