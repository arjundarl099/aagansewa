const express=require('express');
const dotenv=require('dotenv');
const cookieParser = require('cookie-parser');
const connectDb=require('./config/db.js');
const cors = require('cors');
const errorHandler=require('./middleware/error');
dotenv.config({
    path:'./config/config.env'
});
connectDb();

const app=express();
app.use(cors({
  origin: 'http://127.0.0.1:5500',
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true                 
}));
app.use(cookieParser());
app.use(express.json());
const authrouter = require('./route/auth');
const servicesRouter = require('./route/services');
const providerRoutes = require('./route/provider');
const bookerRoutes = require('./route/booker');
app.use('/api/v1/auth',authrouter);
app.use('/api/v1/services',servicesRouter);
app.use('/api/v1/providers', providerRoutes);
app.use('/api/v1/booker', bookerRoutes);
app.use(errorHandler);
const PORT = process.env.PORT || 8000;
app.listen(PORT,()=>{
    console.log(`the sever is running in port ${PORT} on mode ${process.env.NODE_ENV}`);
});
