import { Injectable } from "@nestjs/common";
import { VirusScanService } from "./virus-scan.service";

@Injectable()
export class NoopVirusScanService implements VirusScanService {
  async scan(_buffer: Buffer): Promise<void> {
    return;
  }
}
