// get getData
async function getData(url) {
  let response = await fetch(url);
  let data = await response.json();
  return data
}

// Review Links
$(".allReviewsLink").on('click',viewReviews);
async function viewReviews (){
  let myModal = new bootstrap.Modal(document.getElementById('reviewModal'))
  myModal.show();
  let movieId = $(this).attr("movieId");
  let url = `/api/getReviews?movieId=${movieId}`;
  let data = await getData(url);
  if (data.length > 0) {
   $("#reviewInfo").html("")
   $("#reviewModalLabel").html()
    for (let i = 0; i < data.length; i++) {
      if(data[i].review.length > 0) {
      $("#reviewInfo").append(`<div class='reviewSingle'> ${data[i].review} <br> Rated: ${data[i].rating} <i class='bi-trash'></i>  by <strong>${data[i].username}</strong><br> </div>`);
      }
    }
  } else {
     $("#reviewInfo").html("No ratings yet!");
  }
}

//Add movie to movielist
$(".Added").on("click", added);

  function added(){
    alert("Already Added");
  }
 
 $(".AddMovie").on("click", add);

 function add(){
    let movieId = $(this).attr("movieId");
    let addConfirm = confirm(`Are you sure you want to add movie?`);
    if(addConfirm){
      window.location.href = `/addmovie?movieId=${movieId}`;
    } else {
       window.location.href = '/home';
    }
 } 

//Delete movie from movie list
  $(".movieDelete").on("click", deleteMovie);
  function deleteMovie(){
    let movieId = $(this).attr("movieId");
    let confirmDelete = window.confirm("Confirm your delete");
  
    if(confirmDelete){
      window.location.href = `/profile/deletemovie?movieId=${movieId}`;
    } else {
      window.location.href = '/profile';
    }
  }

// Admin Movie Search
$("#movieAddSearchBtn").on('click',movieAddSearch)

 async function movieAddSearch() {
  let title = $("#movieAddSearchTitle").val();
  let titleFixed = title.split(" ").join("+");
  let url = `https://www.omdbapi.com/?apikey=12215ee6&t=${titleFixed}`;
  let movieData =  await getData(url);
  if(movieData.Response == "True") {
  $("#notFound").html("");
  $("#movieAddTitle").val(movieData.Title);
  $("#movieAddYear").val(movieData.Year);
  $("#movieAddGenre").val(movieData.Genre);
  $("#movieAddDirector").val(movieData.Director);
  $("#movieAddPlot").val(movieData.Plot);
  $("#movieAddPoster").val(movieData.Poster);
  $("#movieAddRating").val(movieData.imdbRating);
  } else { 
  $("#notFound").html("<strong>Movie not found. <br> Please manually enter the infomation below, or try a different movie. </strong>");
  }
}

// Ratings Update
$("#update").on('click',refreshRatings)

async function refreshRatings() {
  // get list of DISTINCT movie ids
  let url = `/api/getRatingMovieIds`;
  let dataMovieIds = await getData(url);


  for (movie of dataMovieIds) {
    //getting number of 
    let urlRatingCount = `/api/getRatingCount?movieId=${movie.movieId}`;
    let count = await getData(urlRatingCount);
    let urlRatings = `/api/getRatings?movieId=${movie.movieId}`;
    let allRatings =  await getData(urlRatings);
    let sum = 0
    for (rating of allRatings) {
      sum += rating.userRatings;
    }
    let urlNewRating = `/api/updateRatings?movieId=${movie.movieId}?rating=${sum/count[0]}`;
    let dataUpdate = await getData(urlNewRating);
  }
}

//nav 
$(document).ready(function () {
    $("ul.navbar-nav > li > a").click(
      function (e) {
        $("ul.navbar-nav > li").removeClass(
          "active");
        $("ul.navbar-nav > li > a").css(
          "color", "");
        $(this).addClass("active");
        $(this).css("background-color", "red");
  });
});