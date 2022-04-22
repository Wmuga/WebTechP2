// Подключение библиотек express, и необходимого middle-ware
import express, { Application, Request, Response } from "express"
import bodyParser from "body-parser"
import path from "path"
// Порт, на котором будет хостится приложение
const port = 5000
// Создание приложения express
const app:Application = express()
// Говорим приложению использовать middle-ware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())

app.set('view engine','ejs')
app.set('views',path.join(process.cwd(), 'templates'))

app.listen(port,()=>{
    console.log(`Working on port ${port}`)
  })
