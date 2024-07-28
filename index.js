const express = require('express')
const path = require('path')
const app = express()
const bcrypt = require('bcryptjs')
const User = require('./models/User')
const Book = require('./models/Book')
const cors = require('cors')
const multer = require('multer')
const jwt = require('jsonwebtoken')

const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/user')
    .then(async() => {
      User.updateMany(
        { purchasedBooks: { $type: "string" } },
        { $set: { purchasedBooks: [] } }
      )
    console.log('Connected to MongoDB')
  }).catch((err) => {
    console.error('Error connecting to MongoDB', err)
  });

app.use(express.json())

app.use(cors({

    origin: 'http://localhost:5173', 
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,

  }))

app.set('views', path.join(__dirname, 'views'))

const storage = multer.memoryStorage();
const upload = multer({ storage: storage })

app.post('/signUp', async(req,res)=>{

    const {userName , password} = req.body
    const hashedPassword = await bcrypt.hash(password,12)
    const newUser = new User({userName, password : hashedPassword, })
    await newUser.save()
    res.send('done')
    
})

app.post('/logIn', async(req,res)=>{

  const {userName , password} = req.body
  const currentUser = await User.findOne({userName : userName})
  const validUser = await bcrypt.compare(password,currentUser.password)
  if(currentUser && validUser)
  {

    const token = jwt.sign({ userName : currentUser.userName }, 'your_jwt_secret')
    res.json({token})

  } 

})

app.get('/logOut', (req,res)=>{

  res.send('logout successful')

})

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'No token provided' })

  jwt.verify(token, 'your_jwt_secret', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' })

    req.user = user
    next()
  }) 
}

app.post('/books/create' , upload.single('image'), authenticateToken, async(req,res)=>{

  const { Title, Author, Genre, Description } = req.body
  const {buffer , mimetype} = req.file
  const price = Math.floor(Math.random() * 500) + 500
  const newBook = await new Book({ Title ,Author, Genre, data : buffer, contentType : mimetype, Description, userName : req.user.userName, Price : price})
  await newBook.save()
  res.status(200).send({ message: 'Data received successfully' })

})

app.get('/books' , authenticateToken, async(req,res)=>{

  const jsonString = req.query.filter
  const filter = JSON.parse(decodeURIComponent(jsonString))
  const books = await Book.find({$or : [{Author : filter[0]}, {Genre : filter[1]}, {Price : {$lt : filter[2]}}]})
  res.send(books)

})

app.delete('/books/delete/:id' , authenticateToken, async(req,res)=>{

  const Id = req.params.id
  const del = await Book.findById(Id)
  if(req.user.userName === del.userName)
  {
    
    const delu = await Book.findByIdAndDelete(Id)
    res.send('success')

  }

})

app.put('/passwordReset/:userName', async(req,res)=>{

  const userName = req.params.userName
  const { confirmPassword } = req.body
  const hashedPassword = await bcrypt.hash(confirmPassword,12)
  await User.findOneAndUpdate({ userName }, { password : hashedPassword },{ new : true })
  res.send('success')

})

app.get('/books/purchase',authenticateToken, async(req,res)=>{

  const purchase = await Book.find({})
  res.send(purchase)

})

app.put('/books/Purchase/:id', authenticateToken, async(req,res)=>{

  const Id = req.params.id
  const book = await User.findById(Id)
  const user = await User.findOneAndUpdate({userName : req.user.userName},{ $push : { purchasedBooks : Id } }, { new : true })
  res.send('success')

})

app.get('/books/purchasedList',authenticateToken, async(req,res)=>{
  
  const user = await User.findOne({ userName : req.user.userName})
  const books = await Book.find({_id : {$in : user.purchasedBooks}})
  res.send(books)

})

app.put('/books/save/:id', authenticateToken, async(req,res)=>{

  const Id = req.params.id
  const book = await User.findById(Id)
  const user = await User.findOneAndUpdate({userName : req.user.userName},{ $push : { savedBooks : Id } }, { new : true })
  res.send('success')

})

app.get('/books/savedList',authenticateToken, async(req,res)=>{
  
  const user = await User.findOne({ userName : req.user.userName})
  const books = await Book.find({_id : {$in : user.savedBooks}})
  res.send(books)

})

app.get('/profile', authenticateToken, async(req,res)=>{

  console.log('hi')
  const user = await User.findOne({userName : req.user.userName})
  console.log(user)
  res.send(user)

})

app.put('/updatePassword', authenticateToken, async(req,res)=>{

  const { confirmPassword } = req.body
  const hashedPassword = await bcrypt.hash(confirmPassword,12)
  await User.findOneAndUpdate({ userName : req.user.userName }, { password : hashedPassword },{ new : true })
  res.send('success')

})

app.put('/updateProfile', upload.single('image'), authenticateToken, async(req,res)=>{

  const { userName, bio, id } = req.body
  const { buffer , mimetype } = req.file
  const updated = {userName, bio}
  updated.data = buffer
  updated.contentType = mimetype
  await User.findByIdAndUpdate(id, {$set : updated})
  res.status(200).send({ message: 'Data updated successfully' })

})

app.listen(3000,()=> {

    console.log("LISTENING ON PORT 3000 :)")

})
