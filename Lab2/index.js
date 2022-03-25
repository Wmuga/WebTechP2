// Подключение библиотек express, парсера тела POST и mysql
const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql')

// Создание необходимых объектов парсера и приложения express
const urlencodedParser = bodyParser.urlencoded({ extended: false })  
const app = express()

// Порт, на котором будет хостится приложение
const port = 5000

//Создаем pool подключений к серверу
let pool = mysql.createPool({
  connectionLimit:7,
  host:'localhost',
  user:'muser',
  password:'123',
  database:'web'
})

app.get('/info',(req,res)=>{
  pool.getConnection((err,connection)=>{
    if (err) console.log(err)
    connection.query('SELECT * FROM lab2;',(err,result,fields)=>{
      if(err) console.log(err)
      
      console.log(result)

      res.render('info-template',{data:result})
      connection.release()
    })
  })
})

// Route на POST  по адрессу /. req.body содержит в себе тело отправленных данных, из которых и собирается ответ
app.post('/info',urlencodedParser,(req,res)=>{
  let body = req.body
  //Проверка на undefined и "обезопасивание" запроса
  body.FN = body.FN ?? ''
  body.SN = body.SN ?? ''
  body.LN = body.LN ?? ''
  body.birth = body.birth ?? '1970-01-01'
  body.healthProbs = body.healthProbs ? 1 : 0
  body.parentsAgreement = body.parentsAgreement ? 1 : 0
  body.phone = body.phone ?? ''
  body.comment = body.comment ?? ''

  let data = [body.FN,body.SN,body.LN,body.sport,body.birth,body.time,body.school,body.healthProbs,body.parentsAgreement,body.phone,body.hpw,body.comment]
  
  res.render('template',{test:JSON.stringify(body)})
  
  pool.getConnection((err,connection)=>{
    if (err) throw err

    let query = 'INSERT INTO lab2 VALUES(?,?,?,?,?,?,?,?,?,?,?,?)'
    connection.query(query,data,(err,res,field)=>{
      if (err) console.log(err)
      console.log(`New post. Affected rows ${res?.affectedRows}`)
    })
    connection.release()
  })
})

// Говорим приложению, что рендерим html через ejs и указываем директорию шаблонов
app.set('view engine','ejs')
app.set('views',__dirname + '/templates')
// Говорим приложению, что все изначально берется из директории /public в папке проекта
app.use(express.static(__dirname + '/public'))


// Говорим приложению, чтобы слушал на заданном порте
app.listen(port,()=>{
  console.log(`Working on port ${port}`)
})
