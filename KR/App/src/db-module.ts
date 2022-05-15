//  passwordHash - sha256 = sha256(username+sha256(password+username))
//  Levels 0 - user,1 - company, 2 - moderator 3 - admin
//  !!!OLD!!! INSERT INTO vacancies(vacancy, salary, company,companyImg, exp, type,about,duties, conditions) VALUES("Петухон-разраб", "50000 на руки","Оригинальное имя", "https://media.discordapp.net/attachments/650556993383170048/936395790170062898/az24e6jug1b41.jpg?width=349&height=671","1 год","Офисный планктон", "<b>Мы типа крутые</b>","<b>Р</b>аботать","Условаия <b>За</b>ши<b>бон</b>");
//  INSERT INTO keywords VALUES(1, "Петухон");
//  INSERT INTO keywords VALUES(1, "Backend");
//  SELECT id WHERE keyword = "Backend";

import dbProvider, {Database} from "sqlite3"
// import dbProvider, {Database} from "mysql"
const dbBase = dbProvider.verbose()
import {createHmac} from "crypto"
import path from "path"

function hash(str:string,salt:string){
  let sha256 = createHmac("sha256",salt)
  const r1 = sha256.update(str)
  sha256 = createHmac("sha256",r1.digest('hex'))
  const r2 = sha256.update(salt)
  return r2.digest('hex')
} 


export class database_connection{
  db:Database;
  constructor(){
    const file = path.join(process.cwd(),'database','kr.db')
    this.db = new dbBase.Database(file)
  }
  add_user(username:string,password:string,level:Number,callback:(added:Boolean)=>void){
    let hashed = hash(password,username)
    this.db.run("INSERT INTO users(name,passw,level) VALUES($un,$pw,$lv)",{
      $un:username,
      $pw:hashed,
      $lv:level
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

  check_username(username:string,callback:(found:Boolean)=>void){
    this.db.get("SELECT level FROM users WHERE name=$un",{
      $un:username
    },(err:Error,row:any)=>{
      if (err){
        console.log(err)
        callback(false)
      }else{
        callback(Boolean(row))
      }
    })
  }
  get_user_profile(id:Number,callback:(user:any)=>void){
    this.db.get(`SELECT *,"" as levelstr FROM users WHERE id=$id`,{
      $id:id,
    },(err:Error,row:any)=>{
      if (err){
        console.log(err)
        callback(null)
      }else{
        row.pfp = row?.pfp? `/profilepic/${row.name}.png` : "/profilepic/nopic.jpg"
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

  get_user(username:string,password:string,callback:(user:any)=>void){
    let hashed = hash(password,username)
    this.db.get(`SELECT * FROM users WHERE name=$un AND passw=$pw`,{
      $un:username,
      $pw:hashed
    },(err:Error,row:any)=>{
      if (err){
        console.log(err)
        callback(null)
      }else{
        callback(row)
      }
    })
  }

  get_vacancy(id:Number,callback:(vacancy:any)=>void){
    this.db.get("SELECT vacancies.*,name as company,pfp as companypfp FROM vacancies JOIN users ON companyId=users.id WHERE vacancies.id=$id",{
      $id:id
    },(err,row)=>{
      if (err){
        console.log(err)
        callback(null)
      }else{
        if (!row) callback(null)
        else{
          row.companypfp = row.companypfp? `/profilepic/${row.company}.png` : "/profilepic/nopic.jpg"
          this.db.all("SELECT keyword FROM keywords WHERE id=$id",{
            $id:id
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

  get_resume(id:Number,callback:(resume:any)=>void){
    this.db.get("SELECT resumes.*,users.name as resname,pfp as respfp FROM resumes JOIN users ON userId=users.id WHERE resumes.id=$id",{
      $id:id
    },(err,row)=>{
      if (err){
        console.log(err)
        callback(null)
      }else{
        row.respfp = row.respfp? `/profilepic/${row.resname}.png` : "/profilepic/nopic.jpg"
        callback(row)
      }
    })
  }
  create_vacancy(uId:Number, vacancy:string, salary:string, about:string, keywords:string[],callback:(added:Boolean)=>void){
    this.db.run("INSERT INTO vacancies(companyID,vacancy,salary,about) VALUES($id,$vac,$sal,$ab)",{
      $id:uId,
      $vac:vacancy,
      $ab:about,
      $sal:salary
    },(err)=>{
      if (err){
        console.log(err)
        callback(false)
      }else{
        this.db.get("SELECT id FROM vacancies ORDER BY id DESC LIMIT 1",(err,row)=>{
          if (err) console.log(err)
          else{
            let query = this.db.prepare(`INSERT INTO keywords VALUES(${row.id},$key)`)
            for(let keyword of keywords){
              query.run({
                $key:keyword
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
  create_resume(uId:Number,resume:string, about:string, callback:(added:Boolean)=>void){
    this.db.run("INSERT INTO resumes(userId, resume, about) VALUES($uId,$res,$ab)",{
      $uId:uId,
      $res:resume,
      $ab:about
    },(err)=>{
      if (err){
        console.log(err)
        callback(false)
      }else{
        callback(true)
      }
    })
  }
  get_vacancies_user(uId:Number,callback:(vacancies:any)=>void){
    this.db.all("SELECT * FROM vacancies WHERE companyId=$id",{
      $id:uId
    },(err,rows)=>{
      if (err){
        console.log(err)
        callback(undefined)
      }else{
        callback(rows)
      }
    })
  }
  get_vacancies_all(keywords:string[],callback:(vacancies:any)=>void){
    let query = "SELECT id, vacancy, salary, keyword FROM vacancies LEFT JOIN keywords USING(id)"
    if (keywords.length>0){
      let keywords4query = `(${keywords.map(e=>`"${e}"`).join(', ')})`
      query = ` SELECT id, vacancy, salary, keyword FROM vacancies LEFT JOIN keywords USING (id) WHERE id in (SELECT id FROM vacancies JOIN keywords USING (id) WHERE keyword in ${keywords4query})`
    }
    this.db.all(query,(err,rows)=>{
      if (err){
        console.log(err)
        callback(undefined)
      }else{
        type vacdata = {
          id:Number,
          vacancy:string,
          salary:string,
          keywords:string[]
        }
        let processed: vacdata[] = []
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

  delete_vacancy(vacId:Number,callback:(deleted:any)=>void){
    this.db.run('DELETE FROM vacancies WHERE id=$id',{
      $id:vacId
    },(err)=>{
      if (err){
        console.log(err)
        callback(false)
      }else{
        callback(true)
      }
    })
  }

  get_resumes_user(uId:Number,callback:(resumes:any)=>void){
    this.db.all("SELECT * FROM resumes WHERE userId=$id",{
      $id:uId
    },(err,rows)=>{
      if (err){
        console.log(err)
        callback(undefined)
      }else{
        callback(rows)
      }
    })
  }

  get_resumes(callback:(resumes:any)=>void){
    this.db.all("SELECT resumes.*,name as resname FROM resumes JOIN users ON userId=users.id",(err,rows)=>{
      if (err){
        console.log(err)
        callback(undefined)
      }else{
        callback(rows)
      }
    })
  }

  delete_resume(resId:Number,callback:(deleted:any)=>void){
    this.db.run('DELETE FROM resumes WHERE id=$id',{
      $id:resId
    },(err)=>{
      if (err){
        console.log(err)
        callback(false)
      }else{
        callback(true)
      }
    })
  }

  get_users(callback:(users:any)=>void){
    this.db.all("SELECT id, name, level FROM users",(err,rows)=>{
      if (err){
        console.log(err)
        callback(undefined)
      }else{
        callback(rows)
      }
    })
  }

  delete_user(uId:Number,callback:(deleted:any)=>void){
    this.db.run('DELETE FROM vacancies WHERE companyId=$id',{
      $id:uId
    },(err)=>{
      if (err){
        console.log(err)
        callback(false)
      }else{
        this.db.run('DELETE FROM resumes WHERE userId=$id',{
          $id:uId
        },(err)=>{
          if (err){
            console.log(err)
            callback(false)
          }else{
            this.db.run('DELETE FROM users WHERE id=$id',{
              $id:uId
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

  update_pic(username:string,callback?:()=>void){
    this.db.run("UPDATE users SET pfp = 1 WHERE name=$un",{
      $un:username
    })
    if (callback) callback()
  }

  update_level(uId:Number, level:Number, callback:(updated:Boolean)=>void){
    this.db.run("UPDATE users SET level = $lv WHERE id = $id",{
      $id:uId,
      $lv:level
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
