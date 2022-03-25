// Подключение библиотек express и парсера тела POST
const express = require('express')
const bodyParser = require('body-parser')

// Создание необходимых объектов парсера и приложения express
const urlencodedParser = bodyParser.urlencoded({ extended: false })  
const app = express()

// Порт, на котором будет хостится приложение
const port = 3000

// Route на POST  по адрессу /. req.body содержит в себе тело отправленных данных, из которых и собирается ответ
app.post('/',urlencodedParser,(req,res)=>{
    res.send(req.body)
})

// Говорим приложению, что рендерим html через ejs и указываем директорию шаблонов
app.set('view engine','ejs')
app.set('views',__dirname + '/templates')

//Рендер шаблона по запросу в /
app.get('/',(req,res)=>{
    res.render('template',{test:'TEST DONE'})
})

// Говорим приложению, что все изначально берется из директории /public в папке проекта
app.use(express.static(__dirname + '/public'))
// Говорим приложению, чтобы слушал на заданном порте
app.listen(port,()=>{
  console.log(`Working on port ${port}`)
})
