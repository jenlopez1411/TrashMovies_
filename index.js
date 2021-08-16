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
  if (fName.length > 0 && username.length > 0 && password.length > 0) {
    let sql = 'INSERT INTO p_users (firstName,username,password) VALUES(?,?,?)'
    let params = [
        fName,
        username,
        password
      ];
      let rows = await executeSQL(sql, params);
      res.render('login', { message: `Welcome ${fName}! Please Log In!` }); 
      }
    else {
      res.render('login', { message: `Please fill out all fields` });
    }
});

app.post('/auth',async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  if (username && password) {
  let sql = 'SELECT * FROM p_users WHERE username = ? AND password = ?'
  let params = [username, password]
  let rows = await executeSQL(sql, params);
		if (rows.length > 0) {
			req.session.loggedin = true;
			req.session.username = rows[0].firstName;
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

app.get('/home', isAuthenticated, async (req, res) => {
  let sql = 'SELECT movieId, title,	year,	genre, director, plot,	poster,	imdbRating, siteRating FROM p_movies';
  let userId = req.session.userId;
  let rows = await executeSQL(sql);
  console.log("hhd");
  let userMovieSQL = `SELECT movieId, userId FROM p_usermovies WHERE userId= ${userId}`
  let userRow = await executeSQL(userMovieSQL);
  console.log(userRow);
  res.render('index', {'movie':rows, 'user':userId, 'userMovie': userRow, 'username':req.session.username });
});


app.get('/home/sort', isAuthenticated, async (req, res) => {
  let sortType = req.query.movieSort;
  if (sortType !='undefined'){
    let sql = `SELECT movieId, title,	year,	genre, director, plot,	poster,	imdbRating, siteRating FROM p_movies ORDER BY ${sortType}`;
    
    let userId = req.session.userId;
    let rows = await executeSQL(sql);
    
    let userMovieSQL = `SELECT movieId, userId FROM p_usermovies WHERE userId= ${userId}`
    let userRow = await executeSQL(userMovieSQL);
    console.log(userRow);
    
    res.render('index', {'movie':rows, 'user':userId, 'userMovie': userRow,'username':req.session.username }); 
    }else {
      res.redirect('/home');
  }
});

app.get('/addmovie', isAuthenticated, async (req , res) =>{
  console.log("add movie");
  let movieId = req.query.movieId;
  let userId = req.session.userId;
  console.log(movieId);
  console.log(userId);
    let sql = 'INSERT INTO p_usermovies (movieId, userId) VALUES(?,?)'
  let params = [movieId, userId];
  let rows = await executeSQL(sql, params);
  let sqlReviews = `INSERT INTO p_reviews(movieId, userId,review) VALUES(${movieId},${userId},"")`
  let reviewRow = await executeSQL(sqlReviews);
  res.redirect('/home');
});

app.get('/profile', isAuthenticated, async (req, res) => {
  let userId = req.session.userId;
  console.log(typeof(userId));
  let sql = `SELECT m.movieId, title,	year,	genre, director, plot,	poster,	imdbRating, siteRating FROM p_movies m INNER JOIN p_usermovies u WHERE u.userId = ? AND m.movieId = u.movieId`;
  let params = [userId];
  let rows = await executeSQL(sql, params);
  //console.log(rows)
  let sqlReviews = `SELECT  review, rating, movieId, reviewId FROM p_reviews WHERE userId = ${userId}`
  let rowsReviews = await executeSQL(sqlReviews);
  console.log(rowsReviews)
  res.render('profile',{'movie':rows,'reviewList': rowsReviews,'user':userId,'username':req.session.username})
  // res.render('profile',{'movie':rows,'user':userId})
});

//delete movie from list
app.get('/profile/deletemovie', isAuthenticated, async (req, res) => {
  console.log("deletemovie ");
  let movieId = req.query.movieId;
  let userId = req.session.userId;
  console.log(movieId);
  let sql = `DELETE FROM p_usermovies WHERE movieId=${movieId} AND userId=${userId}`;
  let rows = await executeSQL(sql);
  let reviewsql = `DELETE FROM p_reviews WHERE movieId=${movieId} AND userId=${userId}`;
  let reviewrows = await executeSQL(sql);
  res.redirect('/profile');
});

app.post('/profile/review', isAuthenticated, async (req, res) => {
  let reviewId = req.body.reviewId;
  let review = req.body.review;
  let rating = req.body.rating;
console.log(reviewId)
  let sql = "UPDATE p_reviews SET review = ?, rating = ? WHERE reviewId = ?"
  let params = [review, rating, reviewId]
  let rows = await executeSQL(sql, params); 
  res.redirect('/profile');
});

app.get('/request',isAuthenticated,  (req, res) => {
   res.render('request',{'username':req.session.username})
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
	res.render('request', { message: `Movie ${title}  requested!` ,'username':req.session.username});
});

app.get('/admin',isAuthenticated, isAdmin,  async(req, res) => {
  let sql = "SELECT title, year, reason FROM p_requests WHERE added = 0"
  let rows = await executeSQL(sql);
  res.render('admin',{"request":rows,'username':req.session.username})
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
  let added = await executeSQL(sqlAdded, addedParams); //removes title from request list;
  res.redirect('/admin')
});

app.get('/settings',isAuthenticated,  (req, res) => {
   res.render('settings',{'username':req.session.username})
});

app.get("/logout", function(req, res){
  req.session.destroy();
  res.redirect("/");
} );


//local api 

app.get('/api/getReviews', async (req, res) => {
  let movieId = req.query.movieId;
  let sql =  `SELECT review, rating, username FROM p_reviews NATURAL JOIN p_users WHERE movieId=${movieId}`;
  let rows = await executeSQL(sql);
  console.log(rows);
  res.send(rows);

});

app.get('/api/getRatingMovieIds', async (req, res) => {
  
  let sql ='SELECT DISTINCT movieId FROM p_reviews';
  let rows = await executeSQL(sql);
  console.log(rows);
  res.send(rows);
  

 });

 app.get('/api/getRatingCount', async (req, res) => {
  let movieId = req.query.movieId;
  let sql =`SELECT COUNT (*) FROM p_reviews WHERE movieId=${movieId}`;
  let rows = await executeSQL(sql);
  console.log(rows);
  res.send(rows);
 });

app.get('/api/getRatings', async (req, res) => {
  let movieId = req.query.movieId;
  let sql =`SELECT rating FROM p_reviews WHERE movieId=${movieId}`;
  let rows = await executeSQL(sql);
  console.log(rows);
  res.send(rows);


 });

 app.get('/api/updateRatings', async (req, res) => {
  let movieId = req.query.movieId;
  let rating = req.query.rating;
  let sql =`UPDATE p_movies SET siteRating=? WHERE movieId= ?`;
  let params = [rating, movieId]
  let rows = await executeSQL(sql,params);
  console.log(rows);
  res.send(rows);
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