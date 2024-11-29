const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const fileUpload = require('express-fileupload')
const cloudinary = require('cloudinary')

const app = express()
const port = 5000;
const JWT_SECRET = 'dfiuifiushfuhd'

app.use(express.json())
app.use(express.urlencoded())
app.use(fileUpload({
    useTempFiles:true
}))

cloudinary.config({
    cloud_name: 'dqfhn7rw3',
    api_key: '382695276612379', 
    api_secret:'3XWIpGNiRSe2K2Cs2t9-fUtPPY0', 
  });


mongoose.connect('mongodb://127.0.0.1:27017/auth-db')
.then(()=>console.log("mongo is connected"))

const userSchema =  new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    otp:{
        type:String,
        default:null
    }
})

const User = mongoose.model('Usertest',userSchema)

app.post('/signup',async (req,res)=>{
    const {name,email,password} = req.body;

    if(!name || !email || !password){
        return res.status(400).json({message:'all fields are required!'})
    }
    try{
        const existinguser = await User.findOne({email})

        if(existinguser){
            return res.status(400).json({message:'user already exists'})
        }
        const salt =  bcrypt.genSaltSync(10)
        const hashedPassword =  bcrypt.hashSync(password,salt)

        const newuser = new User({name,email,password:hashedPassword})
        await newuser.save()

        res.status(200).json({message:"user register successfully"})

    }catch(err){
        console.log(err)
        res.status(500).json({message:"internal server error"})
    }
})

app.post('/upload',async (req,res)=>{
    try{
        if(!req.files || !req.files.image){
            return res.status(400).json({message:"no image is uploaded"})
        }

        const file = req.files.image;

        const result = await cloudinary.uploader.upload(file.tempFilePath)

        res.status(200).json({
            message:"uploaded successfully",
            imageurl:result.secure_url
        })
    }catch(err){
        console.log(err)
        res.status(500).json({message:'failed to upload',err})
    }
})


app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'user not found' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'password is invalid ' });
      }

      const otp = Math.floor(Math.random()*1000000).toString()

      user.otp = otp;
      await user.save()
  
      res.status(200).json({ message: 'enter otp to verify ' ,otp});
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/verify', async(req,res)=>{
    const {email,otp} = req.body;

    if(!email || !otp){
        return res.status(400).json({message:"all fields are required"})
    }
    try{
        const user = await User.findOne({email})
        if(!user){
            return res.status(400).json({message:"user not found"})
        }

        if(user.otp!==otp){
            return res.status(400).json({message:"invalid otp"})
        }

        user.otp = null;
        await user.save()

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({message:'login successful',token})
    }catch(err){
        console.log(err)
        res.status(500).json({message:"server error"})
    }
  })

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);2
  });