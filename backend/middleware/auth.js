const errorResponse = require('../utils/errorResponse');
const jwt = require('jsonwebtoken');
const User = require('../Models/User');

exports.protect = async (req,res,next) => {
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer '))
    {
        token=req.headers.authorization.split(' ')[1];
    }
    if(req.cookies && req.cookies.token)
    {
        token = req.cookies.token;

    }
    if(!token)
    {
        return next(new errorResponse('not authorize this route',401));
    }
    try {
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
         req.user = await User.findById(decoded.id); 
         next();
    }
    catch(err){
         return next(new errorResponse('not authorize this route',401));
    }
}
exports.authorize = (...roles) =>{
    return (req, res, next) =>{
        const allowRoles = roles.map(r => r.toLowerCase());
        if(!req.user){
           return next(new errorResponse('acess Deneid! unathorized',401));
        }
        const userRole  = req.user.role.toLowerCase();

        if(!allowRoles.includes(userRole))
        {
           return next(new errorResponse(`user role with ${req.user.role} is not authorized to access this routes`,403));
        }
        next();
    }
}