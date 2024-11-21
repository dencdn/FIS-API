const {admin, db}  = require('../config/firebase')

const requireAuth = async (req, res, next) => {
    let token = req.cookies.token
    if(!token){
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            
            return res.status(401).json({ success: false, message: 'Unauthorized: no token provided' });
        }
        token = authHeader.split(' ')[1];
    }
    try{
        console.log('hit')
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = {
            name: decodedToken.dispName,
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: decodedToken.role || 0,
            token: token
          };
        
        next()
    }catch(error){
        console.log('require auth', error)
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid Token' });
    }


}

module.exports = requireAuth;