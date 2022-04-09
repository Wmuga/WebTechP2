import {Application,Request,Response} from "express"
import tests from "./test_cases.json"
import crypto from "crypto"
import {database_connection} from "./sqlite-db-module"
import app_options from './app_options.json'
// import {database_connection} from "./mysql-db-module"

export function route(app:Application,db:database_connection):void{
  app.all('/',(req:Request,res:Response)=>{
    let authcookie = req.cookies["auth"]
    let data = authcookie ? decode_auth_cookie(authcookie) : {}
    res.render('main',{'data':data})
  })
  
  app.get('/login',(req:Request,res:Response)=>{
    res.render('login',{'data':{}})
  })
  
  app.post('/login',(req:Request,res:Response)=>{
    let username:string = req.body.login
    let password:string = req.body.password
    db.get_user(username,password,(user)=>{
      if(!user){
        res.render('login',{'data':{'error':'Нет пользователя с такими данными входа'}})
      }else{
        const authcookie:authCookieContent = {
          login: username,
          level: user.level
        }
        res.cookie('auth',encode_auth_cookie(authcookie))
        res.redirect('/')
      }
    })
    // res.render('login',{'data':{}})
  })
  
  app.all('/logout',(req:Request,res:Response)=>{
    res.clearCookie("auth")
    res.redirect('/')
  })
  
  
  app.get('/signin',(req:Request,res:Response)=>{
    res.render('signin',{'data':{}})
  })
  
  app.post('/signin',(req:Request,res:Response)=>{
    let username:string = req.body.login
    let password:string = req.body.password
    db.check_username(username,(found:Boolean)=>{
      if (found){
        res.render('signin',{'data':{'error':'Пользователь с таким ником уже существует'}})
      }else{
        db.add_user(username,password,(added:Boolean)=>{
          if (added){
            let authcookie = encode_auth_cookie({login:username,level:0})
            res.cookie("auth",authcookie)
            res.redirect('/')
          }else
            res.render('signin',{'data':{'error':'Не удалось добавить пользователя'}})
        })
      }
    })
  })
  
  app.all('/vacancy',(req:Request,res:Response)=>{
    //logic for searching article
    let authcookie = req.cookies["auth"]
    let data = authcookie ? decode_auth_cookie(authcookie) : {}
    db.get_vacancy(1,(vacancy)=>{
      res.render('vacancy',{'data':{
        ...data,
        ...vacancy
      }})
    })
  })
  let passw = Buffer.from(app_options.secret)
  let bytes = Buffer.from(app_options.iv)

  function encode_auth_cookie(auth:authCookieContent):string{
    const str = JSON.stringify(auth)
    const cipher = crypto.createCipheriv('aes-256-cbc', passw,bytes)
    const enc = cipher.update(str,'utf8','hex')
    return enc + cipher.final('hex')
  }

  function decode_auth_cookie(cookie:string):authCookieContent{
    const decipher = crypto.createDecipheriv('aes-256-cbc', passw,bytes)
    let dec = decipher.update(cookie,'hex','utf8')
    dec += decipher.final('utf8') 
    return JSON.parse(dec)
  }
}

type authCookieContent = {
  login:string,
  level:number
}

