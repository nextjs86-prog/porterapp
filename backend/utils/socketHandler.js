const Driver = require('../models/Driver');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Driver joins their own room
    socket.on('driver:join', (driverId) => {
      socket.join(`driver:${driverId}`);
    });

    // Customer joins their own room
    socket.on('customer:join', (customerId) => {
      socket.join(`customer:${customerId}`);
    });

    // Driver updates location
    socket.on('driver:location', async ({ driverId, lat, lng }) => {
      try {
        await Driver.findByIdAndUpdate(driverId, {
          currentLocation: { type: 'Point', coordinates: [lng, lat] },
        });
        // Broadcast to any customer tracking this driver
        io.emit(`driver:location:${driverId}`, { lat, lng });
      } catch (err) {
        console.error('Location update error:', err.message);
      }
    });

    // Order status updates
    socket.on('order:status', ({ orderId, customerId, status }) => {
      io.to(`customer:${customerId}`).emit('order:update', { orderId, status });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
};
