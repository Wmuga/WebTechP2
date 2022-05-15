--CREATE DATABASE web;
--USE web;
create table users(id integer primary key autoincrement,name varchar(256),passw varchar(64),pfp tinyint DEFAULT 0,level tinyint default 0);
create table vacancies(id integer primary key autoincrement, companyId integer, vacancy varchar(64), salary varchar(64), about varchar(1024), foreign key (companyId) references users(id));
create table resumes(id integer primary key autoincrement, userId integer, resume varchar(64), about varchar(1024), foreign key (userId) references users(id));
create table keywords(id integer, keyword varchar(32), foreign key (id) references vacancies(id)); 

-- SELECT id, salary, keyword FROM vacancies JOIN keywords USING (id)
-- SELECT id, salary, keyword FROM vacancies JOIN keywords USING (id) 
--   WHERE id in (
--     SELECT id FROM vacancies JOIN keywords USING (id) WHERE keyword in ("test1")
--     );