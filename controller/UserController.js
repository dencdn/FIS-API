const {admin}  = require('../config/firebase')
const login = (req, res) => {
    try{
        console.log('logged in')
        const role = req.user.role
        const token = req.user.token;
        const name = req.user.name;
        const uid = req.user.uid;
        const email = req.user.email
        if(!role){
            return res.status(403).json({success: false, message: "Unauthorized: No role assigned."})
        }

        res.cookie('token', token, {
            httpOnly: true,  
            secure: true,  
            sameSite: 'None' 
        });
        res.status(200).json({ success: true, role: role, name: name, uid: uid, uemail: email});
    }catch(error){
        res.status(500).json({ success: false, message: 'Login failed', error: error.message });
    }
};

const refreshToken = (req, res) => {
    try{
        console.log('refreshing token')
        const refreshTime = new Date().toISOString(); //for check time only
        const role = req.user.role
        const token = req.user.token;
        const name = req.user.name;
        const uid = req.user.uid;
        const email = req.user.email
        res.cookie('token', token, {
            httpOnly: true,  
            secure: true,  
            sameSite: 'None' 
        });
        res.status(200).json({ success: true, role: role, name: name, uid: uid, uemail: email});
    }catch(error){
        res.status(500).json({ success: false, message: 'refresh token failed', error: error.message });
    }
}

module.exports = {
    login, 
    refreshToken
};