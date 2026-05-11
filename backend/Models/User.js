const mongoose=require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt=require('bcryptjs');
const { type } = require('node:os');
const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,'please add name'],
    },
    email:{
        type:String,
        required:[true,'please add email'],
        unique:true,
        match:[
           /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
        ]
      },
      role:{
        type:String,
        enum:['user','publisher','admin'],
        default:'user',
      },
      password:{
        type:String,
        required:[true,'please add password'],
        minlength:6,
        select:false,
      },
      resetPasswordToken:String,
      resetPasswordExpired:Date,
      createdAt:{
        type:Date,
        default:Date.now(),
      },
});
// encrypt password
userSchema.pre('save', async function(next){
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password,salt);
})
userSchema.methods.getSignedJwtToken = function(){
  return jwt.sign({
    id:this.id,
    role:this.role
  },process.env.JWT_SECRET,{
    expiresIn:process.env.JWT_EXPIRE,
  });
}
userSchema.methods.matchPassword = async function(enterPassword) {
  return await bcrypt.compare(enterPassword,this.password);
 
}

module.exports=mongoose.model('User',userSchema);

