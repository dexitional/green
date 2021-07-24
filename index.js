const express = require('express')
const session = require('express-session')
const fileupload = require('express-fileupload')
const cors = require('cors')
const bodyParser = require('body-parser')
const path = require('path')
const fs = require('fs');
const { customAlphabet } = require('nanoid')
const nanoid = customAlphabet('1234567890abcdefgh', 8)



const PORT = 5015

const app = express();
app.use(cors())
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())
app.use(fileupload())
app.set('view engine','ejs')
app.use('/assets',express.static(path.join(__dirname,'public','assets')))
app.use('/public',express.static('public'))

app.get('/', (req,res) => {
  res.render('pages/index')
})

app.get('/login', (req,res) => {
    res.render('pages/login')
})

app.get('/register', (req,res) => {
    res.render('pages/register')
})

app.post('/register', (req,res) => {
    var data = require('./config/data.json')
    var newrec
    var mata = data.data
    //const rec = data.data.find( r => r.voucher == req.body.voucher.trim())
    if(mata){
      mata = mata.map( r => {
        if(r.voucher == req.body.voucher.trim()){
            let dt = {...r,...req.body}
            const pt = `./photos/${req.body.voucher}.${req.files.photo.mimetype.split('/')[1]}`
            if(req.files.photo){
              req.files.photo.mv(pt,(err)=>{
                 console.log(err);
              })
              dt.photo = pt;
            }   
            newrec = { ...dt,photo:pt }
            return newrec
        }   return r
      })
    }

    if(newrec){
      fs.writeFile('./config/data.json',JSON.stringify({...data,data:mata}),(err)=>{ console.log(err)})
      //res.json(data)
      res.send(`<h1> Congratulations! You have submitted your nomination successfully. Please verify your after 24hrs. Thank you!`)
    }else{
      res.json("Error occurred")
    }
})

app.get('/genvoucher', (req,res) => {
  var data = require('./config/data.json');
  const limit = parseInt(req.query.limit) || 1;
  for(var i = 0; i < limit; i++){
      const voucher = nanoid()
      const dt = { voucher }
      data.data.push({...dt})
  }
  fs.writeFile('./config/data.json',JSON.stringify(data),(err)=>{ console.log(err)})
  res.json(data)
})

app.get('/vouchers', (req,res) => {
    var data = require('./config/data.json');
    var dm = data.data.map((d) => {
        return {voucher:d.voucher, sold: d.sold, applicant: d.name}
    })
    res.json(dm)
})


app.get('/sellvoucher', (req,res) => {
    var data = require('./config/data.json');
    var voucher;
    var dm = data.data.map((d) => {
        if(!d.sold){
          if(!voucher){
            voucher = d.voucher
            d.sold = 1;
          } 
          return d
        } return d
    })
    fs.writeFile('./config/data.json',JSON.stringify({...data,data:dm}),(err)=>{ console.log(err)})
    res.send(`<h1>Nomination Voucher : ${voucher}`);
})

app.get('/resetvoucher', (req,res) => {
    var data = require('./config/data.json');
    const vs = req.query.voucher;
    var voucher;
    var dm = data.data.map((d) => {
        if(d.voucher == vs.trim()){
           delete d.sold
           return d
        } 
        return d
    })
    fs.writeFile('./config/data.json',JSON.stringify({...data,data:dm}),(err)=>{ console.log(err)})
    res.send(`<h1>Nomination Voucher : ${vs} has been reset and unsold successfully`);
})


app.listen(PORT, () => {
  console.log(` Server started on port : ${PORT}`)
})