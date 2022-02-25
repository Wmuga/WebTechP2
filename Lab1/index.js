// Подключение библиотек express и парсера тела POST
const express = require('express')
const bodyParser = require('body-parser');  
// Создание необходимых объектов парсера и приложения express
const urlencodedParser = bodyParser.urlencoded({ extended: false })  
const app = express()
// Порт, на котором будет хостится приложение
const port = 3000
// Route на POST  по адрессу /. req.body содержит в себе тело отправленных данных, из которых и собирается ответ
app.post('/',urlencodedParser,(req,res)=>{
  // Парсинг отдельных полученных параметров 
  let talents = ``
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

  let age = ''
  switch(req.body?.Age){
    case '8':
      age = 'до 8'
      break
    case '8_12':
      age = '8-12'
      break
    case '12_18':
      age = '12-18'
      break
    case '18':
      age = 'от 18'
      break
  }
  // Формирование странички ответа
  let response = `
  <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Полученные данные</title></head><body>
  ФИО = ${req.body?.FIO}<br>
  Дата рождения = ${req.body?.BirthData}<br>
  Домашний адресс = ${req.body?.HomeAdress}<br>
  Таланты = ${talents}<br>
  Возраст = ${age}<br>
  Фото = ${req.body?.photo}<br>
  Телефон = ${req.body?.phone}<br>
  Почта = ${req.body?.mail}<br>
  Адресс ДК = ${req.body?.DKAdress}<br>
  Дата отбора = ${req.body?.dateCh}<br>
  Статус = ${req.body?.status}<br>
  Описание = ${req.body?.descr}<br>
  </body></html>
  `
  // Отправление сформированного ответа
  res.send(response)
})

// Говорим приложению, что все изначально берется из директории /public в папке проекта
app.use(express.static(__dirname + '/public'))
// Говорим приложению, чтобы слушал на заданном порте
app.listen(port,()=>{
  console.log(`Working on port ${port}`)
})
