// Необходимые библиотеки
import {Application,Request,Response} from "express"
import {database_connection} from "./db-module"
import multer from "multer"
import path from "path"
import fs from "fs"
import sharp from "sharp"
// говорим куда загружать верменные файлы изображений
const upload = multer({dest:"uploads/"})
// Говорим, что модуль экспортирует функцию route, которая будет маршрутизировать по сайту
export function route(app:Application,db:database_connection):void{
  // Главная страница
  app.all('/',(req:Request,res:Response)=>{
    // Этим способом достается информация о пользователе из сессии
    let userdata = req.session.user_info??{}
    // Рендеринг шаблона main.ejs
    res.render('main',{'data':userdata})
  })
  
  // Страница входа
  app.get('/login',(_:Request,res:Response)=>{
    res.render('login',{'data':{}})
  })
  // По POST запросу попытка входа
  app.post('/login',(req:Request,res:Response)=>{
    // Данные введенные пользователем
    let username:string = req.body.login
    let password:string = req.body.password
    // Проверка, что такой пользователь существует
    db.get_user(username,password,(user)=>{
      if(!user){
        //Есл его нет, ренедерим ошибку
        res.render('login',{'data':{'error':'Нет пользователя с такими данными входа'}})
      }else{
        // Иначе создаем сессию
        req.session.user_info = {
          uId: user.id,
          login: user.name,
          level: user.level
        }
        res.redirect('/')
      }
    })
  })
  // Выход из пользователя
  app.all('/logout',(req:Request,res:Response)=>{
    // Очистка сессии пользовтеля
    req.session.destroy((err)=>{if (err ) console.log(err)})
    // Перенаправление на главную страницу
    res.redirect('/')
  })
  
  // Страница регистрации на сайте
  app.get('/signin',(req:Request,res:Response)=>{
    res.render('signin',{'data':{}})
  })
  
  // Попытка регистрации по POST запросу
  app.post('/signin',(req:Request,res:Response)=>{
    let username:string = req.body.login
    let password:string = req.body.password
    // Так как level - checkbox, определяем значение 0 или 1 через условие
    let level:Number = Number(req.body?.level=="on")
    // Проверка уже сущестующего пользовтеля с таким именем
    db.check_username(username,(found:Boolean)=>{
      if (found){
        // Если найден, говорим об этом
        res.render('signin',{'data':{'error':'Пользователь с таким ником уже существует'}})
      }else{
        // Иначе добавляем такого пользователя
        db.add_user(username,password,level,(added:Boolean)=>{
          if (added){
            // Если успешно добавлен, перенаправляем на вход
            res.redirect('/login')
          }else
            // Иначе говорим о неудаче
            res.render('signin',{'data':{'error':'Не удалось добавить пользователя'}})
        })
      }
    })
  })
  // Страница просмотра вакансии или создания
  app.get('/vacancy',(req:Request,res:Response)=>{
    let userdata = req.session.user_info??{}
    if (req?.query?.id && isFinite(Number(req?.query?.id))){
      // Если указано id рендерим вакансию
      let vId:Number = Number(req?.query?.id)
      db.get_vacancy(vId,(vacancy)=>{
        res.render('vacancy',{'data':{
          ...userdata,
          ...vacancy
        }})
      })
    }else{
      // Проверяем, что пользовтель авторизован
      if (!Object.keys(userdata).length) res.redirect('login')
      else {
        res.render('createVacancy',{data:userdata})
      }
    }
  })
  // Сохдание и просмотр резюме. Принцип тот же, что и на вакансиях
  app.get('/resume',(req:Request,res:Response)=>{
    let userdata = req.session.user_info??{}
    if (req?.query?.id && isFinite(Number(req?.query?.id))){
      let rId:Number = Number(req?.query?.id)
      db.get_resume(rId,(resume)=>{
        res.render('resume',{'data':{
          ...userdata,
          ...resume
        }})
      })
    }else{
      if (!Object.keys(userdata).length) res.redirect('login')
      else {
        res.render('createResume',{data:userdata})
      }
    }
  })
  // Создание вакансии.
  app.post('/vacancy',(req:Request,res:Response)=>{
    // Если пользователь не авторизован, отправляется на авторизацию
    let userdata = req.session.user_info??{}
    if (!Object.keys(userdata).length) res.redirect('login')
    else{
      let userdata = req.session.user_info
      // Разбиение ключевых слов по нескольким возможным разделителям и фильтрация пустых строк 
      let keywords = req.body.keywords.split(/[,. :!#&]+/).filter((e: string)=>e.length>0)
      // Добавление данных в таблицу вакансий
      db.create_vacancy(userdata!.uId,req.body.vacancy,req.body.salary,req.body.about,keywords,(added)=>{
        if (!added){
          res.render('createVacancy',{data:{
            ...userdata,
            error:"Невозможно создать вакансию"
          }})
        }else{
          res.redirect('/')
        }
      })
    }
  })
  // Добавлениие нового резюме в таблицу. Принцип тот же, чтио и с вакансиями
  app.post('/resume',(req:Request,res:Response)=>{
    let userdata = req.session.user_info??{}
    if (!Object.keys(userdata).length) res.redirect('login')
    else{
      let userdata = req.session.user_info
      db.create_resume(userdata!.uId,req.body.resume,req.body.about,(added)=>{
        if (!added){
          res.render('createResume',{
            data:{
              ...userdata,
              error:"Не возможно добавить вакансию"
            }
          })
        }else{
          res.redirect('/')
        }
      })
    }
  })
  // Просмотр профилей
  app.get('/profile',(req:Request,res:Response)=>{
    // Если пользовтель не авторизован, отправляется на авторизацию
    let userdata = req.session.user_info??{}
    if (!Object.keys(userdata).length) res.redirect('login')
    else{
      let userdata = req.session.user_info
      let id = userdata!.uId
      // Если пользователь имеет уровень доступа администратора и он указал id профиля, берется именно указанный профиль, иначе самого пользователя
      if (userdata!.level>2 && req.query?.id && isFinite(Number(req.query?.id))) id = Number(req.query.id)
      // Получение данных профиля пользователя
      db.get_user_profile(id,(row)=>{
        // Если уровень доступа больше модератора, то сразу рендерится
        if(row!.level>1){
          res.render('profile',{data:{
            ...userdata,
            user:row
          }})
        }else{
          // Если это обыкновенный пользователь, идет поиск его резюме
          if (!row!.level){
            db.get_resumes_user(id,(resumes)=>{
              res.render('profile',{data:{
                ...userdata,
                user:row,
                items:resumes
              }})
            })
          }
          if (row.level==1){
          // Если это работодатель, идет поиск его вакансий
            db.get_vacancies_user(id,(vacs)=>{
              res.render('profile',{data:{
                ...userdata,
                user:row,
                items:vacs
              }})
            })
          }
        }
      })     
    }
  })
  // Обновление фото пользователя
  app.post('/uploadPic',upload.single('img'),(req:Request,res:Response)=>{
    // Проверка, что отправлена картинка
    if (req.file?.filename){
      let userdata = req.session.user_info
      if (!userdata) res.redirect('/login')
      // Говорим базе, что у пользователя есть картинка
      db.update_pic(userdata!.login)
      // Достаем изображение из временного файла
      let pathim = req.file.path
      let image = sharp(pathim)
      // Изменяем его размеры
      image.resize(64,64,{fit:"inside"})
      // Сохрняем в папке фото пользователя
      image.toFile(path.join(process.cwd(),"public","profilepic",`${userdata!.login}.png`)).then(()=>{
        // Удаление временного файла
        fs.unlink(pathim,()=>{})
        res.redirect('profile')
      })
    }else{
      res.redirect('profile')
    }
  })
  //Страница поиска вакансий
  app.get('/search',(req:Request,res:Response)=>{
    let userdata = req.session.user_info
    db.get_vacancies_all([],(vacancies)=>{
      res.render('search_vac',{data:{...userdata,items:vacancies}})
    })
  })
  // Страница поиска резюме
  app.get('/searchr',(req:Request,res:Response)=>{
    let userdata = req.session.user_info
    db.get_resumes((resumes)=>{
      res.render('search_res',{data:{...userdata,items:resumes}})
    })
  })
  // Поиск резюме по ключевым словам
  app.post('/search',(req:Request,res:Response)=>{
    let keywords = req.body?.keywords?.length ? req.body.keywords.split(/[,. :!#&]+/).filter((e: string)=>e.length>0) : []
    db.get_vacancies_all(keywords,(vacancies)=>{
      res.status(200).send(JSON.stringify(vacancies))
    })
  })
  //  Удаление вакансии
  app.delete('/vacancy',(req:Request,res:Response)=>{
    // Проверка, что у пользователя есть уровень доступа модератора минимум
    let userdata = req.session.user_info
    if (!userdata|| typeof(req?.query?.id)=="undefined"  || userdata.level<2) res.status(403).end()
    db.delete_vacancy(Number(req.query.id),(deleted)=>{
      res.status(deleted?204:500).end()
    })
  })
  // Удаление резюме
  app.delete('/resume',(req:Request,res:Response)=>{
    let userdata = req.session.user_info
    if (!userdata|| typeof(req?.query?.id)=="undefined"  || userdata.level<2) res.status(403).end()
    db.delete_resume(Number(req.query.id),(deleted)=>{
      res.status(deleted?204:500).end()
    })
  })
  // Просмотр зарегстрированных пользователей
  app.get('/users',(req:Request,res:Response)=>{
    let userdata = req.session.user_info
    if (!userdata  || userdata.level!=3) {
      res.status(403).end()
      return
    }
    db.get_users((users)=>{
      if(!users) {
        res.status(500).end()
        return
      }
      res.render('users',{data:{
        ...userdata,
        items:users
      }})
    })
  })
  // Удаление пользоателей
  app.delete('/user',(req:Request,res:Response)=>{
    let userdata = req.session.user_info
    if (!userdata|| typeof(req?.query?.id)=="undefined"  || userdata.level<3) res.status(403).end()
    db.delete_user(Number(req.query.id),(deleted)=>{
      res.status(deleted?204:500).end()
    })
  })
  // Изменение типа пользователя
  app.patch('/user',(req:Request,res:Response)=>{
    let userdata = req.session.user_info
    // Если нет доступа 403 код
    if (!userdata || typeof(req?.query?.id)=="undefined" || typeof(req?.query?.level)=="undefined" || userdata.level<3) res.status(403).end()
    db.update_level(Number(req.query.id),Number(req.query.level),(updated)=>{
      // Если успешно посылается 204 код, иначе 500й
      res.status(updated?204:500).end()
    })
  })
}

