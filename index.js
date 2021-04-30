const express = require('express');
const mysql = require('mysql');
const session = require('express-session')
const app = express();
const pool = dbConnection();


const fetch = require('node-fetch');

app.set("view engine", "ejs");
app.use(express.static("public"));
// to be able to get paremeters using POST
app.use(express.urlencoded(
  {extended: true}));

  //sessions
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'kmcslocmetjo',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))


//Routes
app.get('/', (req, res) => {
  if (req.session.loggedin == true) {
    	res.redirect('/home');
  } else{
res.render("login")
  }
});

app.post('/',  async (req, res) => {
let fName = req.body.firstName;
let username = req.body.username;
let password = req.body.password;
let sql = 'INSERT INTO p_users (firstName,username,password) VALUES(?,?,?)'
let params = [
    fName,
    username,
    password
  ];
  let rows = await executeSQL(sql, params);
	res.render('login', { message: `Welcome ${fName}! Please Log In!` });

});

app.post('/auth',async (req, res) => {
  let username = req.body.username;
let password = req.body.password;

if (username && password) {
  let sql = 'SELECT * FROM p_users WHERE username = ? AND password = ?'
  let params = [username, password]
  let rows = await executeSQL(sql, params);
		// pool.query('SELECT * FROM p_users WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (rows.length > 0) {
				req.session.loggedin = true;
				req.session.username = username;
        console.log(rows);
        req.session.admin = rows[0].admin
        req.session.userId = rows[0].userId;
        console.log(req.session.userId);
				res.redirect('/home');
       
			} else {
				res.render('login', { message: 'Incorrect Username and/or Password!' });
					res.end();
			
		}
	} else {
		res.render('login', { message: 'Please enter Username and Password!'});
		res.end();
	}
});


app.get('/home',isAuthenticated, async (req, res) => {
  let sql = 'SELECT movieId, title,	year,	genre, director, plot,	poster,	imdbRating, siteRating FROM p_movies';
 let rows = await executeSQL(sql)

   res.render('index',{'movie':rows})
});

app.post('/home', async (req, res) => {
  
  
});

app.get('/profile',  async (req, res) => {
  let userId = req.session.userId;
  console.log(typeof(userId));
  let sql = `SELECT m.movieId, title,	year,	genre, director, plot,	poster,	imdbRating, siteRating FROM p_movies m INNER JOIN p_usermovies u WHERE u.userId = ? AND m.movieId = u.movieId`;
  let params = [userId];
  let rows = await executeSQL(sql, params);
  console.log(rows)

  res.render('profile',{'movie':rows})
});


app.get('/request',isAuthenticated,  (req, res) => {
   res.render('request')
});

app.post('/request', isAuthenticated, async (req, res) => {
let title = req.body.title;
let year = req.body.year;
let reason= req.body.reason;
let sql = 'INSERT INTO p_requests (title, year, reason) VALUES(?,?,?)'
let params = [
    title,
    year,
    reason
  ];
  let rows = await executeSQL(sql, params);
	res.render('request', { message: `Movie ${title}  requested!` });

});

app.get('/admin',isAuthenticated, isAdmin,  async(req, res) => {
  let sql = "SELECT title, year, reason FROM p_requests WHERE added = 0"
  let rows = await executeSQL(sql);
   
   res.render('admin',{"request":rows})
});

app.post('/admin', async(req, res) => {
let title = req.body.title;
let year = req.body.year;
let genre = 	req.body.genre;
let director	= req.body.director;
let plot	= req.body.plot;
let poster	= req.body.poster;
let imdbRating	= req.body.imdbRating;

let sql = 'INSERT INTO p_movies (title,	year,	genre, director,	plot,	poster,	imdbRating	) VALUES (?, ?, ?, ?, ?, ?, ?)';
let sqlAdded = `UPDATE p_requests SET added=1 WHERE title LIKE CONCAT("%",?,"%")`;
let params = [
    title,	
    year,	
    genre,
    director,	
    plot,	
    poster,		
    imdbRating	
];
let addedParams = [title];

let rows = await executeSQL(sql, params);
let added = await executeSQL(sqlAdded,addedParams); //removes title from request list;

res.redirect('/admin')
});

app.get('/settings',isAuthenticated,  (req, res) => {
   res.render('settings')
});

app.get("/logout", function(req, res){

  req.session.destroy();
  res.redirect("/");

} );



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

function isAuthenticated(req, res, next) {
  if (!req.session.loggedin) {
    res.redirect('/')
  } else {
    next();
  }
}

function isAdmin(req, res, next) {
  if (req.session.admin != 1) {
    res.redirect('/home')
  } else {
    next();
  }
}