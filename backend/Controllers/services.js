const Services = require('../Models/Services');
exports.getAllServices = async(req,res,next)=> {
    const services = await Services.find();
    res.status(200).json({
        success:true,
        message:'the data are fetch successfully'
    })

}