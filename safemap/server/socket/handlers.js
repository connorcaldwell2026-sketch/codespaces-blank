import { Server } from 'socket.io';

let ioInstance;

export const registerSocketHandlers = (server) => {
  const io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000' }
  });
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log('Socket connected', socket.id);
    socket.on('join-region', (regionId) => {
      socket.join(regionId);
    });
    socket.on('assign-report', ({ reportId, officerId }) => {
      io.emit('report:assigned', { reportId, officerId });
    });
    socket.on('disconnect', () => {
      console.log('Socket disconnected', socket.id);
    });
  });

  return io;
};

export const getIo = () => {
  if (!ioInstance) throw new Error('Socket IO not initialized');
  return ioInstance;
};

export default { registerSocketHandlers, getIo };
