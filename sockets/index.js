const {Server} = require('socket.io')
const socketAuth = require('../middleware/socketAuth')

const editorSocket = require('./editorSocket');
const adminSocket = require('./adminSocket')
const operatorSocket = require('./operatorSocket')
const headSocket = require('./headSocket')

const initializeSockets = (server) => {
    const io = new Server(server, {
        cors: {
            origin: 'http://localhost:5173',
            methods: ['GET', 'POST', 'DELETE', 'PATCH'],
            credentials: true,
        },
    })

    io.use(socketAuth);

    console.log('Socket.IO initialized');

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id, 'role: ', socket.user.role);

        switch(socket.user.role){
            case '1':
                adminSocket(socket, io);
                break;
            case '2':
                headSocket(socket, io);
                break;
            case '3':
                operatorSocket(socket, io);
                break;
            case '4':
                editorSocket(socket, io);
                break;
        }
        // userSocket(socket, io);
        // adminSocket(socket, io);
        // editorSocket(socket, io)
        // operatorSocket(socket, io);
        // headSocket(socket, io);

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });

    return io;
};

module.exports = initializeSockets;