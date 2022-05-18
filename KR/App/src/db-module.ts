import dbProvider, {Pool} from "mysql2"
import {createHmac} from "crypto"
import app_options from   "./app_options.json"

//Функция хэширования. Двухэиапное хеширование sha256 с солью
function hash(str:string,salt:string){
  let sha256 = createHmac("sha256",salt)
  const r1 = sha256.update(str)
  sha256 = createHmac("sha256",r1.digest('hex'))
  const r2 = sha256.update(salt)
  return r2.digest('hex')
} 


export class database_connection{
  db:Pool
  constructor(){
    // Pool соединений в базу данных
    this.db = dbProvider.createPool({
      connectionLimit:7,
      host:'localhost',
      user:app_options.db_user,
      password:app_options.db_user_password,
      database:app_options.db,
      namedPlaceholders:true
    })
  }
  // Добавление пользователля
  add_user(username:string,password:string,level:Number,callback:(added:Boolean)=>void){
    // Хэширование пароля
    let hashed = hash(password,username)
    // Добавление пользователя через подготовленный запрос с именнованой заглушкой
    this.db.query("INSERT INTO users(name,passw,level) VALUES(:un,:pw,:lv)",{
      un:username,
      pw:hashed,
      lv:level
    },(err)=>{
      if (err){
        console.log(err)
        callback(false)
      }
      else{
        callback(true)
      }
    })
  }
  // Проверка есть ли пользователь с таким ником
  check_username(username:string,callback:(found:Boolean)=>void){
    this.db.query("SELECT level FROM users WHERE name=:un",{
      un:username
    },(err,row:any)=>{
      if (err){
        console.log(err)
        callback(false)
      }else{
        callback(Boolean(row[0]))
      }
    })
  }
  // Получение профиля пользователя
  get_user_profile(id:Number,callback:(user:any)=>void){
    this.db.query(`SELECT *,"" as levelstr FROM users WHERE id=:id`,{
      id:id,
    },(err,row:any)=>{
      if (err){
        console.log(err)
        callback(null)
      }else{
        row = row[0]
        // определение фото профиля
        row.pfp = row?.pfp? `/profilepic/${row.name}.png` : "/profilepic/nopic.jpg"
        // Преобразования уровня пользователя из числа в строку
        switch(row.level){
          case 1:
            row.levelstr = "Работодатель"
            break
          case 2:
            row.levelstr = "Модератор"
            break
          case 3:
            row.levelstr = "Админ"
            break       
          default:
            row.levelstr = "Пользователь"
            break
        }
        callback(row)
      }
    })
  }
  // Проверка наличии пользователя с данными логином и паролем
  get_user(username:string,password:string,callback:(user:any)=>void){
    let hashed = hash(password,username)
    this.db.query(`SELECT * FROM users WHERE name=:un AND passw=:pw`,{
      un:username,
      pw:hashed
    },(err,row:any)=>{
      if (err){
        console.log(err)
        callback(null)
      }else{
        callback(row[0])
      }
    })
  }
  // Получение полных данных о вакансии; вакансия, пользователь, создавший ее и ключевые слова
  get_vacancy(id:Number,callback:(vacancy:any)=>void){
    this.db.query("SELECT vacancies.*,name as company,pfp as companypfp FROM vacancies JOIN users ON companyId=users.id WHERE vacancies.id=:id",{
      id:id
    },(err,row:any)=>{
      if (err){
        console.log(err)
        callback(null)
      }else{
        if (!row) callback(null)
        else{
          row = row[0]
          row.companypfp = row.companypfp? `/profilepic/${row.company}.png` : "/profilepic/nopic.jpg"
          // Получение ключевых слов
          this.db.query("SELECT keyword FROM keywords WHERE id=:id",{
            id:id
          },(err,rows)=>{
            if (err){
              console.log(err)
              callback({
                ...row,
                keywords:[]
              })
            }else{
              callback({
                ...row,
                keywords: rows
              })
            }
          })
        }
      }
    })
  }
  // Получение полных данных о резюме; резюме, пользователь, создавший его
  get_resume(id:Number,callback:(resume:any)=>void){
    this.db.query("SELECT resumes.*,users.name as resname,pfp as respfp FROM resumes JOIN users ON userId=users.id WHERE resumes.id=:id",{
      id:id
    },(err,row:any)=>{
      if (err){
        console.log(err)
        callback(null)
      }else{
        row = row[0]
        row.respfp = row.respfp? `/profilepic/${row.resname}.png` : "/profilepic/nopic.jpg"
        callback(row)
      }
    })
  }
  // Добавление новой вакансии в базу данных
  create_vacancy(uId:Number, vacancy:string, salary:string, about:string, keywords:string[],callback:(added:Boolean)=>void){
    this.db.query("INSERT INTO vacancies(companyID,vacancy,salary,about) VALUES(:id,:vac,:sal,:ab)",{
      id:uId,
      vac:vacancy,
      ab:about,
      sal:salary
    },(err)=>{
      if (err){
        console.log(err)
        callback(false)
      }else{
        // Получение id последний вакансии для добавления к ней ключевых слов
        this.db.query("SELECT id FROM vacancies ORDER BY id DESC LIMIT 1",(err,row:any)=>{
          if (err) console.log(err)
          else{
            row = row[0]
            for(let keyword of keywords){
              this.db.query(`INSERT INTO keywords VALUES(${row.id},:key)`,{
                key:keyword
              },(err)=>{
                if (err) console.log(err)
              })
            }
          }
          callback(true)
        })
      }
    })
  }
  // Добавление нового резюме в базу данных
  create_resume(uId:Number,resume:string, about:string, callback:(added:Boolean)=>void){
    this.db.query("INSERT INTO resumes(userId, resume, about) VALUES(:uId,:res,:ab)",{
      uId:uId,
      res:resume,
      ab:about
    },(err)=>{
      if (err){
        console.log(err)
        callback(false)
      }else{
        callback(true)
      }
    })
  }
  // Получение всех вакансий пользователя
  get_vacancies_user(uId:Number,callback:(vacancies:any)=>void){
    this.db.query("SELECT * FROM vacancies WHERE companyId=:id",{
      id:uId
    },(err,rows)=>{
      if (err){
        console.log(err)
        callback(undefined)
      }else{
        callback(rows)
      }
    })
  }
  // Получение всех вакансий с поиском по ключевым словам
  get_vacancies_all(keywords:string[],callback:(vacancies:any)=>void){
    // Выбор запроса на основании есть ли ключевые слова
    let query = "SELECT id, vacancy, salary, keyword FROM vacancies LEFT JOIN keywords USING(id)"
    if (keywords?.length>0){
      let keywords4query = `(${keywords.map(e=>`"${e}"`).join(', ')})`
      query = ` SELECT id, vacancy, salary, keyword FROM vacancies LEFT JOIN keywords USING (id) WHERE id in (SELECT id FROM vacancies JOIN keywords USING (id) WHERE keyword in ${keywords4query})`
    }
    this.db.query(query,(err,rows:any)=>{
      if (err){
        console.log(err)
        callback(undefined)
      }else{
        // тип получившихся данных
        type vacdata = {
          id:Number,
          vacancy:string,
          salary:string,
          keywords:string[]
        }
        // Собранный массив
        let processed: vacdata[] = []
        // Так как ключевые слова приходят по отдельности, надо объединить вакансии и их ключевые слова
        for(let row of rows){
          let id = processed.findIndex(e=>e.id==row.id) 
          if (id==-1){
            let rowdata: vacdata = {id:row.id,vacancy:row.vacancy,salary:row.salary,keywords:[]}
            if (row.keyword) rowdata.keywords.push(row.keyword)
            processed.push(rowdata)
          }
          else{
            processed[id].keywords.push(row.keyword)
          }
        }
        callback(processed)
      }
    })
  }
  // Удаление вакансии
  delete_vacancy(vacId:Number,callback:(deleted:any)=>void){
    this.db.query('DELETE FROM vacancies WHERE id=:id',{
      id:vacId
    },(err)=>{
      if (err){
        console.log(err)
        callback(false)
      }else{
        callback(true)
      }
    })
  }
  // Получение резюме по id пользователяы
  get_resumes_user(uId:Number,callback:(resumes:any)=>void){
    this.db.query("SELECT * FROM resumes WHERE userId=:id",{
      id:uId
    },(err,rows)=>{
      if (err){
        console.log(err)
        callback(undefined)
      }else{
        callback(rows)
      }
    })
  }
  // Получение всех резюме
  get_resumes(callback:(resumes:any)=>void){
    this.db.query("SELECT resumes.*,name as resname FROM resumes JOIN users ON userId=users.id",(err,rows)=>{
      if (err){
        console.log(err)
        callback(undefined)
      }else{
        callback(rows)
      }
    })
  }
  // Удаление резюме
  delete_resume(resId:Number,callback:(deleted:any)=>void){
    this.db.query('DELETE FROM resumes WHERE id=:id',{
      id:resId
    },(err)=>{
      if (err){
        console.log(err)
        callback(false)
      }else{
        callback(true)
      }
    })
  }
  // Получение всех пользователей
  get_users(callback:(users:any)=>void){
    this.db.query("SELECT id, name, level FROM users",(err,rows)=>{
      if (err){
        console.log(err)
        callback(undefined)
      }else{
        callback(rows)
      }
    })
  }
  // Удаление пользователя
  delete_user(uId:Number,callback:(deleted:any)=>void){
    // Так как нему могут быть привязаны вакансии и резюме, надо сначала удалить их
    this.db.query('DELETE FROM vacancies WHERE companyId=:id',{
      id:uId
    },(err)=>{
      if (err){
        console.log(err)
        callback(false)
      }else{
        this.db.query('DELETE FROM resumes WHERE userId=:id',{
          id:uId
        },(err)=>{
          if (err){
            console.log(err)
            callback(false)
          }else{
            this.db.query('DELETE FROM users WHERE id=:id',{
              id:uId
            },(err)=>{
              if (err){
                console.log(err)
                callback(false)
              }else{
                callback(true)
              }
            })
          }
        })
      }
    })
  }
  // Укзаание вв базе, что упользователя появилось фото
  update_pic(username:string,callback?:()=>void){
    this.db.query("UPDATE users SET pfp = 1 WHERE name=:un",{
      un:username
    })
    if (callback) callback()
  }
  // Изменение типа пользователя
  update_level(uId:Number, level:Number, callback:(updated:Boolean)=>void){
    this.db.query("UPDATE users SET level = :lv WHERE id = :id",{
      id:uId,
      lv:level
    },(err)=>{
      if(err){
        console.log(err)
        callback(false)
      }else{
        callback(true)
      }
    })
  }
}