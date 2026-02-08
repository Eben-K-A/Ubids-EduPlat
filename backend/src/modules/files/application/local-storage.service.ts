import { Injectable } from "@nestjs/common";
import { promises as fsPromises, createReadStream } from "fs";
import path from "path";
import { ConfigService } from "@nestjs/config";
import { StorageService } from "./storage.service";

@Injectable()
export class LocalStorageService implements StorageService {
  private basePath: string;

  constructor(configService: ConfigService) {
    this.basePath = configService.get<string>("files.storagePath") || "./data/uploads";
  }

  async saveFile(key: string, buffer: Buffer, _contentType?: string): Promise<void> {
    const targetPath = path.join(this.basePath, key);
    await fsPromises.mkdir(path.dirname(targetPath), { recursive: true });
    await fsPromises.writeFile(targetPath, buffer);
  }

  async getFileStream(key: string): Promise<NodeJS.ReadableStream> {
    const targetPath = path.join(this.basePath, key);
    return createReadStream(targetPath);
  }

  async getSignedDownloadUrl(): Promise<string | null> {
    return null;
  }

  async getSignedUploadUrl(): Promise<string | null> {
    return null;
  }
}
