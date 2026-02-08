export interface VirusScanService {
  scan(buffer: Buffer): Promise<void>;
}
