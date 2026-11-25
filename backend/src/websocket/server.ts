import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '@/utils/auth';
import prisma from '@/utils/database';
import logger from '@/utils/logger';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    role: string;
    company_id: string;
  };
}

export class WebSocketServer {
  private io: SocketIOServer;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      path: '/socket.io/',
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = verifyToken(token);
        
        // Verify user still exists and is active
        const user = await prisma.user.findUnique({
          where: {
            id: decoded.id,
            is_active: true,
          },
          select: {
            id: true,
            email: true,
            role: true,
            company_id: true,
          },
        });

        if (!user) {
          return next(new Error('User not found or inactive'));
        }

        socket.user = user;
        next();
      } catch (error) {
        logger.error('WebSocket authentication error:', error);
        next(new Error('Invalid token'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`User ${socket.user?.email} connected to WebSocket`);

      // Join company room for multi-tenant isolation
      const companyRoom = `company:${socket.user?.company_id}`;
      socket.join(companyRoom);

      // Join user-specific room for personal notifications
      const userRoom = `user:${socket.user?.id}`;
      socket.join(userRoom);

      // Handle joining conversation rooms
      socket.on('join_conversation', async (conversationId: string) => {
        try {
          // Verify user has access to this conversation
          const conversation = await prisma.conversation.findFirst({
            where: {
              id: conversationId,
              company_id: socket.user!.company_id,
            },
          });

          if (conversation) {
            socket.join(`conversation:${conversationId}`);
            logger.info(`User ${socket.user?.email} joined conversation ${conversationId}`);
          } else {
            socket.emit('error', { message: 'Conversation not found or access denied' });
          }
        } catch (error) {
          logger.error('Error joining conversation:', error);
          socket.emit('error', { message: 'Error joining conversation' });
        }
      });

      // Handle leaving conversation rooms
      socket.on('leave_conversation', (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
        logger.info(`User ${socket.user?.email} left conversation ${conversationId}`);
      });

      // Handle typing indicators
      socket.on('typing_start', (conversationId: string) => {
        socket.to(`conversation:${conversationId}`).emit('user_typing', {
          conversationId,
          userId: socket.user?.id,
          userName: socket.user?.email,
        });
      });

      socket.on('typing_stop', (conversationId: string) => {
        socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
          conversationId,
          userId: socket.user?.id,
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`User ${socket.user?.email} disconnected from WebSocket`);
      });
    });
  }

  // Emit new message to conversation participants
  public emitNewMessage(conversationId: string, message: any): void {
    this.io.to(`conversation:${conversationId}`).emit('new_message', {
      conversationId,
      message,
    });
  }

  // Emit conversation status update
  public emitConversationUpdate(conversationId: string, update: any): void {
    this.io.to(`conversation:${conversationId}`).emit('conversation_updated', {
      conversationId,
      update,
    });
  }

  // Emit notification to specific user
  public emitUserNotification(userId: string, notification: any): void {
    this.io.to(`user:${userId}`).emit('notification', notification);
  }

  // Emit notification to all users in a company
  public emitCompanyNotification(companyId: string, notification: any): void {
    this.io.to(`company:${companyId}`).emit('company_notification', notification);
  }

  // Emit channel status update
  public emitChannelStatusUpdate(companyId: string, channelId: string, status: string): void {
    this.io.to(`company:${companyId}`).emit('channel_status_update', {
      channelId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  // Get connected users count for a company
  public async getConnectedUsersCount(companyId: string): Promise<number> {
    const sockets = await this.io.in(`company:${companyId}`).fetchSockets();
    return sockets.length;
  }

  // Get Socket.IO instance for external use
  public getIO(): SocketIOServer {
    return this.io;
  }
}

export default WebSocketServer;