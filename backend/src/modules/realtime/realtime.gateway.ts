import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Server, Socket } from "socket.io";

@WebSocketGateway({ namespace: "/realtime", cors: { origin: "*" } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService, private readonly configService: ConfigService) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token || client.handshake.headers.authorization?.toString().replace("Bearer ", "");
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>("jwt.accessSecret")
      });
      client.data.user = { id: payload.sub, role: payload.role };
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket) {
    return;
  }
}
