// socket.js
let ioInstance;

function initSocket(server) {
  const { Server } = require('socket.io');
  ioInstance = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  ioInstance.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

function broadcast(message) {
  if (ioInstance) {
    ioInstance.emit('deployment-update', message);
  }
}

module.exports = { initSocket, broadcast };
