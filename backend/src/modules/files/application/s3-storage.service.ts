import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StorageService } from "./storage.service";

@Injectable()
export class S3StorageService implements StorageService {
  private client: S3Client;
  private bucket: string;

  constructor(private readonly configService: ConfigService) {
    const s3 = this.configService.get<any>("files.s3");
    this.bucket = s3?.bucket;
    this.client = new S3Client({
      region: s3?.region,
      endpoint: s3?.endpoint || undefined,
      credentials: s3?.accessKeyId && s3?.secretAccessKey
        ? {
            accessKeyId: s3.accessKeyId,
            secretAccessKey: s3.secretAccessKey
          }
        : undefined
    });
  }

  async saveFile(key: string, buffer: Buffer, contentType?: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType
      })
    );
  }

  async getFileStream(key: string): Promise<NodeJS.ReadableStream> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      })
    );
    if (!response.Body) {
      throw new Error("File not found");
    }
    return response.Body as NodeJS.ReadableStream;
  }

  async getSignedDownloadUrl(key: string, filename: string, mimeType: string, expiresIn: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename=\"${filename}\"`,
      ResponseContentType: mimeType
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  async getSignedUploadUrl(key: string, contentType: string, expiresIn: number): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }
}
