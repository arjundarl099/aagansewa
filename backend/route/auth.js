const {loginUser, registerUser, getMe} =require('../Controllers/auth');
const express=require('express');
const router=express.Router();
const {protect} = require('../middleware/auth');
router.
route('/login')
.post(loginUser);
router.
route('/register')
.post(registerUser);
router.
route('/Me')
.get(protect,getMe);

module.exports=router;