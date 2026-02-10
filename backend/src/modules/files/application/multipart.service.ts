import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "../../../infra/redis/redis.service";

@Injectable()
export class MultipartService {
  private client: S3Client;
  private bucket: string;

  constructor(private readonly configService: ConfigService, private readonly redis: RedisService) {
    const s3 = this.configService.get<any>("files.s3");
    this.bucket = s3?.bucket;
    this.client = new S3Client({
      region: s3?.region,
      endpoint: s3?.endpoint || undefined,
      credentials: s3?.accessKeyId && s3?.secretAccessKey
        ? { accessKeyId: s3.accessKeyId, secretAccessKey: s3.secretAccessKey }
        : undefined
    });
  }

  private keyFor(uploadId: string) {
    return `mpu:${uploadId}`;
  }

  async initiate(ownerId: string, storageKey: string, mimeType: string) {
    const command = new CreateMultipartUploadCommand({
      Bucket: this.bucket,
      Key: storageKey,
      ContentType: mimeType
    });
    const response = await this.client.send(command);
    if (!response.UploadId) throw new NotFoundException("UploadId missing");
    await this.redis.getClient().set(this.keyFor(response.UploadId), `${ownerId}:${storageKey}`, "EX", 3600);
    return { uploadId: response.UploadId, storageKey };
  }

  private async assertOwnership(ownerId: string, uploadId: string, storageKey: string) {
    const value = await this.redis.getClient().get(this.keyFor(uploadId));
    if (!value) throw new NotFoundException("Upload not found");
    const [storedOwner, storedKey] = value.split(":");
    if (storedOwner !== ownerId || storedKey !== storageKey) {
      throw new ForbiddenException();
    }
  }

  async getPartUrl(ownerId: string, uploadId: string, storageKey: string, partNumber: number) {
    await this.assertOwnership(ownerId, uploadId, storageKey);
    const command = new UploadPartCommand({
      Bucket: this.bucket,
      Key: storageKey,
      UploadId: uploadId,
      PartNumber: partNumber
    });
    return getSignedUrl(this.client, command, { expiresIn: 900 });
  }

  async complete(ownerId: string, uploadId: string, storageKey: string, parts: Array<{ ETag: string; PartNumber: number }>) {
    await this.assertOwnership(ownerId, uploadId, storageKey);
    const command = new CompleteMultipartUploadCommand({
      Bucket: this.bucket,
      Key: storageKey,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts }
    });
    await this.client.send(command);
    await this.redis.getClient().del(this.keyFor(uploadId));
  }
}
