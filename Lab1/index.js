// Подключение библиотек express и парсера тела POST
const express = require('express')
const bodyParser = require('body-parser');  
// Создание необходимых объектов парсера и приложения express
const urlencodedParser = bodyParser.urlencoded({ extended: false })  
const app = express()
// Порт, на котором будет хостится приложение
const port = 4000
// Route на POST  по адрессу /. req.body содержит в себе тело отправленных данных, из которых и собирается ответ
app.post('/',urlencodedParser,(req,res)=>{
  // Парсинг отдельных полученных параметров 
  let talents = ``
  if (!typeof(req.body?.talent)=="string") 
  {
    for(let talent of req.body?.talent){
      switch(talent){
        case 'Dance':
          talents+='Современный танец, '
          break
        case 'Vocal':
          talents+='Вокал, '
          break
        case 'Acting':
          talents+='Актерское мастерство, '
          break      
      }
    }
    talents = talents.substring(0,talents.length? talents.length-2 : 0)
    req.body.talent = talents
  }
  
  switch(req.body?.Age){
    case '8':
      req.body.age = 'до 8'
      break
    case '8_12':
      req.body.age = '8-12'
      break
    case '12_18':
      req.body.age = '12-18'
      break
    case '18':
      req.body.age = 'от 18'
      break
  }
  // Отправление сформированного ответа
  res.render('template',req.body)
})

// Говорим приложению, что все изначально берется из директории /public в папке проекта
app.use(express.static(__dirname + '/public'))
// Говорим приложению, что рендерим html через ejs и указываем директорию шаблонов
app.set('view engine','ejs')
app.set('views',__dirname + '/templates')
// Говорим приложению, чтобы слушал на заданном порте
app.listen(port,()=>{
  console.log(`Working on port ${port}`)
})
