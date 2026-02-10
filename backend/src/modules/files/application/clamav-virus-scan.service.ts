import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import net from "net";
import { VirusScanService } from "./virus-scan.service";

@Injectable()
export class ClamAvVirusScanService implements VirusScanService {
  async scan(buffer: Buffer): Promise<void> {
    if (!process.env.CLAMAV_HOST) return;

    const host = process.env.CLAMAV_HOST;
    const port = process.env.CLAMAV_PORT ? Number(process.env.CLAMAV_PORT) : 3310;

    const socket = net.createConnection(port, host);
    const response = await new Promise<string>((resolve, reject) => {
      let data = "";
      socket.on("data", (chunk) => {
        data += chunk.toString();
      });
      socket.on("end", () => resolve(data));
      socket.on("error", reject);

      socket.write("zINSTREAM\0");
      const chunkSize = 1024 * 4;
      for (let i = 0; i < buffer.length; i += chunkSize) {
        const chunk = buffer.subarray(i, i + chunkSize);
        const size = Buffer.alloc(4);
        size.writeUInt32BE(chunk.length, 0);
        socket.write(size);
        socket.write(chunk);
      }
      const end = Buffer.alloc(4);
      end.writeUInt32BE(0, 0);
      socket.write(end);
      socket.end();
    });

    if (response.includes("FOUND")) {
      throw new ServiceUnavailableException("Malware detected");
    }
  }
}
