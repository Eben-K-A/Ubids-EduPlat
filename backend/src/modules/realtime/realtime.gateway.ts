import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { RedisService } from "../../infra/redis/redis.service";

@WebSocketGateway({ namespace: "/realtime", cors: { origin: "*" } })
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService
  ) {}

  async afterInit(server: Server) {
    const pubClient = this.redisService.getClient().duplicate();
    const subClient = this.redisService.getClient().duplicate();
    server.adapter(createAdapter(pubClient, subClient));
  }

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
      await this.redisService.getClient().set(`presence:${payload.sub}`, "online", "EX", 60);
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user as { id?: string } | undefined;
    if (user?.id) {
      await this.redisService.getClient().del(`presence:${user.id}`);
    }
  }
}
