const {admin, db}  = require('../config/firebase')

const refreshAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        
        return res.status(401).json({ success: false, message: 'Unauthorized: no token provided' });
    }
    token = authHeader.split(' ')[1];
    try{
        console.log(token)
        const decodedToken = await admin.auth().verifyIdToken(token);
        console.log(decodedToken)
        req.user = {
            name: decodedToken.dispName,
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: decodedToken.role || 0,
            token: token
          };
        
        next()
    }catch(error){
        console.log("EXPIRED TOKEN, CAN'T VERIFY!!!!!")
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid Token' });
    }


}

module.exports = refreshAuth;