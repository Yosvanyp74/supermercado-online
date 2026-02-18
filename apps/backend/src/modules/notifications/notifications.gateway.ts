import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Rooms:
 *   user:{userId}       — personal room for each user
 *   role:ADMIN           — all admins
 *   role:MANAGER         — all managers
 *   role:SELLER          — all sellers
 *   role:DELIVERY        — all delivery persons
 */
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} without token — disconnecting`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true, firstName: true, isActive: true },
      });

      if (!user || !user.isActive) {
        client.disconnect();
        return;
      }

      // Store user info on socket
      client.data.userId = user.id;
      client.data.role = user.role;

      // Join personal room and role room
      client.join(`user:${user.id}`);
      client.join(`role:${user.role}`);

      this.logger.log(
        `✅ ${user.firstName} (${user.role}) connected — socket ${client.id}`,
      );
    } catch (err: any) {
      this.logger.warn(`Auth failed for ${client.id}: ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`❌ Socket ${client.id} disconnected`);
  }

  // ───── Emit helpers ─────

  /** Send to a specific user */
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /** Send to all users with a specific role */
  emitToRole(role: string, event: string, data: any) {
    this.server.to(`role:${role}`).emit(event, data);
  }

  /** Send to multiple roles */
  emitToRoles(roles: string[], event: string, data: any) {
    for (const role of roles) {
      this.server.to(`role:${role}`).emit(event, data);
    }
  }

  // ───── Client-side subscription for marking read ─────

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(client: Socket, payload: { notificationId: string }) {
    const userId = client.data.userId;
    if (!userId) return;

    try {
      await this.prisma.notification.updateMany({
        where: { id: payload.notificationId, userId },
        data: { isRead: true, readAt: new Date() },
      });
      client.emit('notificationRead', { id: payload.notificationId });
    } catch {
      // Ignore
    }
  }

  @SubscribeMessage('markAllAsRead')
  async handleMarkAllAsRead(client: Socket) {
    const userId = client.data.userId;
    if (!userId) return;

    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    client.emit('allNotificationsRead');
  }
}
