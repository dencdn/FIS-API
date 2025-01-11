const { admin } = require('../config/firebase');

const socketAuth = async (socket, next) => {
    try{
        
        const token = socket.handshake.headers.cookie
            ?.split(';')
            ?.find((c) => c.trim().startsWith('token='))
            ?.split('=')[1];
        
        
        if (!token) {
            console.log('Unauthorized: No token provided')
            return next(new Error('Unauthorized: No token provided'));
        }
        const decodedToken = await admin.auth().verifyIdToken(token);
        socket.user = {
            name: decodedToken.dispName,
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: decodedToken.role || 0,
        };
        console.log(socket.user)
        next();
    }catch(err){
        console.error('Socket authentication failed:', err.message);
        next(new Error('Unauthorized: Invalid token'));
    }
}

module.exports = socketAuth