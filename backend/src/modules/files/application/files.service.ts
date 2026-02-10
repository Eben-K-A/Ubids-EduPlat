import { Inject, Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FileEntity } from "../domain/file.entity";
import { StorageService } from "./storage.service";
import { VirusScanService } from "./virus-scan.service";
import { randomUUID, createHash } from "crypto";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly filesRepo: Repository<FileEntity>,
    @Inject("StorageService")
    private readonly storage: StorageService,
    @Inject("VirusScanService")
    private readonly virusScan: VirusScanService,
    private readonly configService: ConfigService
  ) {}

  async upload(ownerId: string, file: Express.Multer.File) {
    const storageKey = `${ownerId}/${randomUUID()}-${file.originalname}`;
    await this.virusScan.scan(file.buffer);
    const checksum = createHash("sha256").update(file.buffer).digest("hex");
    await this.storage.saveFile(storageKey, file.buffer, file.mimetype);
    const entity = this.filesRepo.create({
      ownerId,
      filename: file.originalname,
      storageKey,
      mimeType: file.mimetype,
      size: file.size,
      checksum
    });
    return this.filesRepo.save(entity);
  }

  private ensureOwnerOrAdmin(file: FileEntity, actor: { id: string; role: string }) {
    if (actor.role === "admin") return;
    if (file.ownerId !== actor.id) throw new ForbiddenException();
  }

  async download(fileId: string, actor: { id: string; role: string }) {
    const file = await this.filesRepo.findOne({ where: { id: fileId } });
    if (!file) return null;
    this.ensureOwnerOrAdmin(file, actor);
    const stream = await this.storage.getFileStream(file.storageKey);
    return { file, stream };
  }

  async getSignedDownloadUrl(fileId: string, actor: { id: string; role: string }) {
    const file = await this.filesRepo.findOne({ where: { id: fileId } });
    if (!file) throw new NotFoundException("File not found");
    this.ensureOwnerOrAdmin(file, actor);
    const ttl = this.configService.get<number>("files.s3.signedUrlTtl") || 900;
    const url = await this.storage.getSignedDownloadUrl(file.storageKey, file.filename, file.mimeType, ttl);
    if (!url) throw new NotFoundException("Signed URLs not supported");
    return { url };
  }

  async getSignedUploadUrl(ownerId: string, filename: string, mimeType: string, size: number, checksum?: string) {
    const storageKey = `${ownerId}/${randomUUID()}-${filename}`;
    const ttl = this.configService.get<number>("files.s3.signedUrlTtl") || 900;
    const url = await this.storage.getSignedUploadUrl(storageKey, mimeType, ttl);
    if (!url) throw new NotFoundException("Signed URLs not supported");
    const entity = this.filesRepo.create({
      ownerId,
      filename,
      storageKey,
      mimeType,
      size,
      checksum: checksum || null
    });
    await this.filesRepo.save(entity);
    return { url, fileId: entity.id, storageKey };
  }

  async finalizeMultipart(ownerId: string, storageKey: string, filename: string, mimeType: string, size: number, checksum?: string) {
    const entity = this.filesRepo.create({
      ownerId,
      filename,
      storageKey,
      mimeType,
      size,
      checksum: checksum || null
    });
    await this.filesRepo.save(entity);
    return { fileId: entity.id };
  }
}
