const { json } = require('express');
const User = require('../Models/User');
const errorResponse = require('../utils/errorResponse');
exports.registerUser= async (req,res,next) =>{
    const {name,email,password,role} = req.body;
    try{
        const user = await User.create({
            name,
            email,
            password,
            role
        });
        
       sendTokenResponse(user,200,res);
    }
    catch(err)
    {
        next(err);
    }
}
exports.loginUser = async (req,res,next) => {
    const {email,password} = req.body;
    if(!email || !password)
    {
        return next(new errorResponse('please fill up both feild',400));
    }
    try{
        const user=await User.findOne({email}).select('+password');
    if(!user) {
       return next(new errorResponse('invalid credential',401));
    }
    const  ismatch = await user.matchPassword(password);
    if(!ismatch){
        return next(new errorResponse('invalid credential',401));

    }

    sendTokenResponse(user,200,res);
}
    catch(err){
        next(err);
    }
}

const sendTokenResponse = (user,status,res) => {
    const token = user.getSignedJwtToken();
    const options = {
        expires : new Date(
             Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 *60 * 60 * 1000,
        ),
        httpOnly:true,
        sameSite: 'Lax'
    }
    if(process.env.NODE_ENV === 'production')
    { 
        options.secure=true;
    }
    res.status(status)
    .cookie('token',token,options)
    .json({
        success:true,
        token
    });
}
exports.getMe = async(req,res, next) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({
        success:true,
        data:user
    });
}