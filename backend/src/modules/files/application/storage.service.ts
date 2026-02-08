export interface StorageService {
  saveFile(key: string, buffer: Buffer, contentType?: string): Promise<void>;
  getFileStream(key: string): Promise<NodeJS.ReadableStream>;
  getSignedDownloadUrl(key: string, filename: string, mimeType: string, expiresIn: number): Promise<string | null>;
  getSignedUploadUrl(key: string, contentType: string, expiresIn: number): Promise<string | null>;
}
