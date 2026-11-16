module.exports = {
  corsOptions: {
    origin: '*', // Allow all client origins for dev flexibility
    methods: ['GET', 'POST'],
    credentials: true
  },
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' }
  ]
};
