//  passwordHash - sha256 = sha256(username+sha256(password+username))
//  Levels 0 - user, 1 - moderator 2 - admin
//  create table users(id integer primary key autoincrement,name varchar(256),passw varchar(64),level tinyint);
//  create table vacancies(id integer primary key autoincrement, vacancy varchar(128), salary varchar(64), company varchar(128), companyImg varchar(128), exp varchar(64), type varchar(128), about varchar(256), duties varchar(256), conditions varchar(256));
//  create table keywords(id integer, keyword varchar(32), foreign key (id) references vacancies(id));
//  INSERT INTO vacancies(vacancy, salary, company,companyImg, exp, type,about,duties, conditions) VALUES("Петухон-разраб", "50000 на руки","Оригинальное имя", "https://media.discordapp.net/attachments/650556993383170048/936395790170062898/az24e6jug1b41.jpg?width=349&height=671","1 год","Офисный планктон", "<b>Мы типа крутые</b>","<b>Р</b>аботать","Условаия <b>За</b>ши<b>бон</b>");
//  INSERT INTO keywords VALUES(1, "Петухон");
//  INSERT INTO keywords VALUES(1, "Backend");
//  SELECT id WHERE keyword = "Backend";

import sqlite3, {Database} from "sqlite3"
const sqlite = sqlite3.verbose()
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
    this.db = new sqlite.Database(file)
  }
  add_user(username:string,password:string,callback:(added:Boolean)=>void){
    let hashed = hash(password,username)
    this.db.run(`INSERT INTO users(name,passw,level) VALUES(\"${username}\",\"${hashed}\",0)`,(err)=>{
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
    this.db.get(`SELECT level FROM users WHERE name=\"${username}\"`,(err:Error,row:any)=>{
      if (err){
        console.log(err)
        callback(false)
      }else{
        callback(Boolean(row))
      }
    })
  }
  get_user(username:string,password:string,callback:(user:any)=>void){
    let hashed = hash(password,username)
    this.db.get(`SELECT * FROM users WHERE name="${username}" AND passw="${hashed}"`,(err:Error,row:any)=>{
      if (err){
        console.log(err)
        callback(null)
      }else{
        callback(row)
      }
    })
  }

  get_vacancy(id:number,callback:(vacancy:any)=>void){
    this.db.get(`SELECT * FROM vacancies WHERE id=${id}`,(err,row)=>{
      if (err){
        console.log(err)
        callback(null)
      }else{
        if (!row) callback(null)
        else{
          this.db.all(`SELECT keyword FROM keywords WHERE id=${id}`,(err,rows)=>{
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

  // add_vacancy(id)

}


