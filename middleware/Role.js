const setRole = (usersRole) => {
    return (req, res, next) => {
        // == to access specific role only
        // >= the less the usersRole the more it can have the ability to use the others role feature
        //req.user && req.user.role == usersRole
        if (!(req.user || !usersRole.includes(req.user.role))){
            return res.status(403).json({ success: false, message: 'Access denied: Insufficient permissions' });
        }
        next();
    }
}

module.exports = setRole;