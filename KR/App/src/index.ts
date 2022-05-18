// Подключение библиотек express, и необходимого middle-ware
import express, { Application, Request, Response } from "express"
import bodyParser from "body-parser"
import cookieParser from "cookie-parser"
import favicon from "serve-favicon"
import session from "express-session"

import path from "path"
import app_options from './app_options.json'
import {database_connection} from "./db-module"
import { route } from "./routes"
// import {database_connection} from "./mysql-db-module"
// Создание необходимых объектов парсера и приложения express
const app:Application = express()
const db = new database_connection()
//Указание типа Options
// Порт, на котором будет хостится приложение
const port = app_options.port
// Говорим приложению использовать middle-ware
app.use(favicon(path.join(process.cwd(),'public','favicon','favicon.ico')))
app.use(bodyParser.urlencoded({ limit:'50mb',extended: true }))
app.use(cookieParser())
// Говорим, что в сессии будет находиться данные о пользователе
declare module 'express-session' {
  export interface SessionData {
    user_info?: {
      uId:Number,
      login: string,
      level: Number
    }
  }
}
// Настройка сессий
app.use(session({
  secret:app_options.secret.toString(), cookie: {sameSite:"lax" }, rolling: true, saveUninitialized:true,resave:true
}))


// Функция маршрутизации из внешнего файла
route(app,db)

// Говорим приложению, что рендерим html через ejs и указываем директорию шаблонов
app.set('view engine','ejs')
app.set('views',path.join(process.cwd(), 'templates'))
// Говорим приложению, что все изначально берется из директории /public в папке проекта
app.use(express.static(path.join(process.cwd(), 'public')))
// Стандарткая страница 404
app.use(function(_:Request, res:Response) {
  res.status(404).sendFile(path.join(process.cwd(), 'public','404.html'))
});

// Говорим приложению, чтобы слушал на заданном порте
app.listen(port,()=>{
  console.log(`Working on port ${port}`)
})
// Удобное добавление пользователей для загрузки в бд
// function add_root(){
//   let db = new database_connection()
//   db.add_user('noob','noob',2,()=>{console.log('Added user')})
//   db.add_user('test','test',1,()=>{console.log('Added user')})
//   db.add_user('root','qazxsw',3,()=>{console.log('Added user')})
//   db.add_user('user','user',0,()=>{console.log('Added user')})
// }

// add_root()

