import {Application,Request,Response} from "express"
import {database_connection} from "./db-module"
import multer from "multer"
import path from "path"
import fs from "fs"
import sharp from "sharp"
// говорим куда загружать верменные файлы изображений
const upload = multer({dest:"uploads/"})

export function route(app:Application,db:database_connection):void{
  app.all('/',(req:Request,res:Response)=>{
    let userdata = req.session.user_info??{}
    res.render('main',{'data':userdata})
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
        req.session.user_info = {
          uId: user.id,
          login: user.name,
          level: user.level
        }
        res.redirect('/')
      }
    })
  })
  
  app.all('/logout',(req:Request,res:Response)=>{
    res.clearCookie("auth")
    req.session.destroy((err)=>{if (err ) console.log(err)})
    res.redirect('/')
  })
  
  
  app.get('/signin',(req:Request,res:Response)=>{
    res.render('signin',{'data':{}})
  })
  
  app.post('/signin',(req:Request,res:Response)=>{
    let username:string = req.body.login
    let password:string = req.body.password
    let level:Number = Number(req.body?.level=="on")
    db.check_username(username,(found:Boolean)=>{
      if (found){
        res.render('signin',{'data':{'error':'Пользователь с таким ником уже существует'}})
      }else{
        db.add_user(username,password,level,(added:Boolean)=>{
          if (added){
            res.redirect('/login')
          }else
            res.render('signin',{'data':{'error':'Не удалось добавить пользователя'}})
        })
      }
    })
  })
  
  app.get('/vacancy',(req:Request,res:Response)=>{
    let userdata = req.session.user_info??{}
    if (req?.query?.id && Number(req?.query?.id)){
      let vId:Number = Number(req?.query?.id)
      db.get_vacancy(vId,(vacancy)=>{
        res.render('vacancy',{'data':{
          ...userdata,
          ...vacancy
        }})
      })
    }else{
      if (!Object.keys(userdata).length) res.redirect('login')
      else {
        res.render('createVacancy',{data:userdata})
      }
    }
  })

  app.get('/resume',(req:Request,res:Response)=>{
    let userdata = req.session.user_info??{}
    if (req?.query?.id && Number(req?.query?.id)){
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

  app.post('/vacancy',(req:Request,res:Response)=>{
    let userdata = req.session.user_info??{}
    if (!Object.keys(userdata).length) res.redirect('login')
    else{
      let userdata = req.session.user_info
      let keywords = req.body.keywords.split(/[,. :!#&]+/).filter((e: string)=>e.length>0)
      db.create_vacancy(userdata!.uId,req.body.vacancy,req.body.salary,req.body.about,keywords,(added)=>{
        if (!added){
          res.render('createVacancy',{data:{
            ...userdata,
            error:"Can't add vacancy"
          }})
        }else{
          res.redirect('/')
        }
      })
    }
  })

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
              error:"Can't add resume"
            }
          })
        }else{
          res.redirect('/')
        }
      })
    }
  })

  app.get('/profile',(req:Request,res:Response)=>{
    let userdata = req.session.user_info??{}
    if (!Object.keys(userdata).length) res.redirect('login')
    else{
      let userdata = req.session.user_info
      let id = userdata!.uId
      if (userdata!.level>1 && req.query?.id) id = Number(req.query.id)
      db.get_user_profile(id,(row)=>{
        if(row!.level>1){
          res.render('profile',{data:{
            ...userdata,
            user:row
          }})
        }else{
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

  app.post('/uploadPic',upload.single('img'),(req:Request,res:Response)=>{
    if (req.file?.filename){
      let userdata = req.session.user_info
      if (!userdata) res.redirect('/login')
      db.update_pic(userdata!.login)
      let pathim = req.file.path
      let image = sharp(pathim)
      image.resize(64,64,{fit:"inside"})
      image.toFile(path.join(process.cwd(),"public","profilepic",`${userdata!.login}.png`)).then(()=>{
        fs.unlink(pathim,()=>{})
        res.redirect('profile')
      })
    }else{
      res.redirect('profile')
    }
  })

  app.get('/search',(req:Request,res:Response)=>{
    let userdata = req.session.user_info
    db.get_vacancies_all([],(vacancies)=>{
      res.render('search_vac',{data:{...userdata,items:vacancies}})
    })
  })

  app.get('/searchr',(req:Request,res:Response)=>{
    let userdata = req.session.user_info
    db.get_resumes((resumes)=>{
      res.render('search_res',{data:{...userdata,items:resumes}})
    })
  })

  app.post('/search',(req:Request,res:Response)=>{
    let keywords = req.body?.keywords?.length ? req.body.keywords.split(/[,. :!#&]+/).filter((e: string)=>e.length>0) : []
    db.get_vacancies_all(keywords,(vacancies)=>{
      res.status(200).send(JSON.stringify(vacancies))
    })
  })

  app.delete('/vacancy',(req:Request,res:Response)=>{
    let userdata = req.session.user_info
    if (!userdata|| typeof(req?.query?.id)=="undefined"  || userdata.level<2) res.status(403).end()
    db.delete_vacancy(Number(req.query.id),(deleted)=>{
      res.status(deleted?204:500).end()
    })
  })

  app.delete('/resume',(req:Request,res:Response)=>{
    let userdata = req.session.user_info
    if (!userdata|| typeof(req?.query?.id)=="undefined"  || userdata.level<2) res.status(403).end()
    db.delete_resume(Number(req.query.id),(deleted)=>{
      res.status(deleted?204:500).end()
    })
  })

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

  app.delete('/user',(req:Request,res:Response)=>{
    let userdata = req.session.user_info
    if (!userdata|| typeof(req?.query?.id)=="undefined"  || userdata.level<3) res.status(403).end()
    db.delete_user(Number(req.query.id),(deleted)=>{
      res.status(deleted?204:500).end()
    })
  })

  app.patch('/user',(req:Request,res:Response)=>{
    let userdata = req.session.user_info
    if (!userdata || typeof(req?.query?.id)=="undefined" || typeof(req?.query?.level)=="undefined" || userdata.level<3) res.status(403).end()
    db.update_level(Number(req.query.id),Number(req.query.level),(updated)=>{
      res.status(updated?204:500).end()
    })
  })
}

