const express = require('express')
const session = require('express-session')
const fileupload = require('express-fileupload')
const cors = require('cors')
const bodyParser = require('body-parser')
const path = require('path')
const fs = require('fs');
const { customAlphabet } = require('nanoid')
const nanoid = customAlphabet('1234567890abcdefgh', 8)
const db = require('./config/mysql')



const PORT = 5015

const app = express();
app.use(cors())
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())
app.use(fileupload())
app.set('view engine','ejs')
app.use('/assets',express.static(path.join(__dirname,'public','assets')))
app.use('/public',express.static('public'))
app.use('/photos',express.static('photos'))

app.get('/', (req,res) => {
  res.render('pages/index')
})

app.get('/login', (req,res) => {
    res.render('pages/login')
})

app.get('/register', (req,res) => {
    res.render('pages/register')
})

app.post('/register', async(req,res) => {
    const s = await db.query("select * from applicant where voucher = '"+req.body.voucher.trim()+"'")
    if(s.length > 0){
       const pt = req.files ? `./photos/${req.body.voucher}.${req.files.photo.mimetype.split('/')[1]}`: null;
       if(req.files){
         req.files.photo.mv(pt,(err)=>{
           console.log(err);
         })
         req.body.photo = pt;
       } req.body.used = 1
       
       delete req.body.id
       const up = await db.query("update applicant set ? where voucher = '"+req.body.voucher.trim()+"'", req.body)
       res.redirect('/print/'+req.body.voucher.trim())
    }else{
      res.send("<h1>INVALID VOUCHER</h1>")
    }
})

app.get('/genvoucher', async(req,res) => {
  var data = [];
  const limit = parseInt(req.query.limit) || 1;
  for(var i = 0; i < limit; i++){
      const voucher = nanoid()
      const dt = { voucher }
      await db.query("insert into applicant set ?",dt)
      data.push({...dt})
  }
  res.json(data)
})

app.get('/vouchers', async(req,res) => {
    const data = await db.query("select * from applicant");
    var output = `<table style="border:2px solid #666;padding:10px 15px"><tr style="background:#eee;padding:5px"><td><b>VOUCHER</b></td><td><b>SOLD</b></td><td><b>APPLICANT</b></td></tr/>`
    if(data.length > 0){
      data.map((d) => {
        output += `<tr><td><b>${d.voucher}</b></td><td>${d.sold && d.sold == 1 ? 'YES':'NO'}</td><td>${d.name || ''}</td></tr>`;
      })
    }
    output += `</table>`
    res.send(output)
})


app.get('/sellvoucher', async(req,res) => {
    const data = await db.query("select * from applicant where sold = 0 limit 1");
    if(data.length > 0){
       await db.query("update applicant set sold = 1 where voucher = '"+data[0].voucher+"'")
       res.send(`<h1>Nomination Voucher : ${data[0].voucher}`);
    }else{
       res.send(`<h1>No Voucher available to sell</h1>`);
    }
})

app.get('/resetvoucher', async(req,res) => {
    const vs = req.query.voucher;
    const data = await db.query("select * from applicant where voucher = '"+vs+"'");
    if(data.length > 0){
       await db.query("update applicant set sold = 0, used = 0 where voucher = '"+data[0].voucher+"'")
       res.send(`<h1>Nomination Voucher : ${vs} has been reset and unsold successfully`);
    }else{
       res.send(`<h1>Voucher reset failed !</h1>`);
    }
})

app.get('/print/:id', async(req,res) => {
    const id = req.params.id.trim();
    const data = await db.query("select *,date_format(dob,'%M %d, %Y') as dob from applicant where voucher = '"+id+"'");
    if(data.length > 0){
      res.render('pages/print',{ row:data[0] })
    }else{
      return res.json("No Record found !")
    }
});


app.get('/applicants', async(req,res) => {
    const data = await db.query("select *,date_format(dob,'%M %d, %Y') as dob from applicant where used = 1");
    if(data.length > 0){
      res.render('pages/applicant',{ rows: data })
    }else{
      res.send("<h3>No Application recorded !</h3>")
    }
});


app.listen(PORT, () => {
  console.log(` Server started on port : ${PORT}`)
})