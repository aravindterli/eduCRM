import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: '*', // We'll rely on our Express CORS but allow socket handshake
      methods: ['GET', 'post'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      console.log('[Socket] Connection rejected: No token');
      socket.disconnect();
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const userId = decoded.id;
      
      // Join a private room for this user
      socket.join(userId);
      console.log(`[Socket] User ${userId} connected and joined room`);

      socket.on('disconnect', () => {
        console.log(`[Socket] User ${userId} disconnected`);
      });
    } catch (err) {
      console.log('[Socket] Connection rejected: Invalid token');
      socket.disconnect();
    }
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(userId).emit(event, data);
  }
};
