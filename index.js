const express = require('express');
const mysql = require('mysql');

const app = express();
const pool = dbConnection();

const fetch = require('node-fetch');

app.set("view engine", "ejs");
app.use(express.static("public"));

//Routes
app.get('/', (req, res) => {
   res.render('index')
});

//Database Routes
app.get("/dbTest", async function(req, res){

let sql = "SELECT * FROM q_authors";
let rows = await executeSQL(sql);
res.send(rows);
});//dbTest

//server listener
app.listen(3000, () => { //3000 for replit 8080 for local
   console.log('server started');
});



//functions

async function executeSQL(sql, params){
return new Promise (function (resolve, reject) {
pool.query(sql, params, function (err, rows, fields) {
if (err) throw err;
   resolve(rows);
});
});
}//executeSQL

function dbConnection(){

   const pool  = mysql.createPool({

      connectionLimit: 10,
      host:  "pxukqohrckdfo4ty.cbetxkdyhwsb.us-east-1.rds.amazonaws.com", // your_hostname
      user: "yerg62ky3ijxmlhe", // your_username
      password: "kwd7olxgqycc9jgt", // your_password
      database: "j1bkbf4erh116qmn"// your_database

   }); 

   return pool;

}