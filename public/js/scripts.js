// get getData
async function getData(url) {
    let response = await fetch(url);
   let data = await response.json();
    return data
  }


// Movie Search
$("#searchBtn").on('click',movieSearch)

async function movieSearch() {
    let searchInput = $("movieSearchText").val();
    let searchType = $("movieSearch").val();

    if (searchType == "director") {
      let url = `/api/getMovieByDirector?director=${searchInput}`;
      let data = getData(url);
      console.log(data);
    }
  //window.locaton.href = 

  }

// Review Links
$(".allReviewsLink").on('click',viewReviews);
async function viewReviews (){
  let myModal = new bootstrap.Modal(document.getElementById('reviewModal'))
  myModal.show();
  let movieId = $(this).attr("movieId");
  let url = `/api/getReviews?movieId=${movieId}`;
  let data = await getData(url);
   $("#reviewInfo").html("")
    for (let i = 0; i < data.length; i++) {
      if(data[i].review.length > 0) {
      $("#reviewInfo").append(`<div class='reviewSingle'> ${data[i].review} <br> Rated: ${data[i].rating} <i class='bi-trash'></i>  by <strong>${data[i].username}</strong><br> </div>`);
      }
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
    let addConfirm = confirm(`Are you sure you want to add movie? ${movieId}`);
    if(addConfirm){
      window.location.href = `/addmovie?movieId=${movieId}`;
    }
 } 

//Delete movie from movie list
  $(".movieDelete").on("click", deleteMovie);
  function deleteMovie(){
    let movieId = $(this).attr("movieId");
    let confirmDelete = confirm(`Deleting ${movieId}`);
    if(confirmDelete){
      window.location.href = `/profile/deletemovie?movieId=${movieId}`;
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
  console.log(movieData)
  console.log(movieData.Title); 
  console.log(movieData.Genre); 
  $("#movieAddTitle").val(movieData.Title);
  $("#movieAddYear").val(movieData.Year);
  $("#movieAddGenre").val(movieData.Genre);
  $("#movieAddDirector").val(movieData.Director);
  $("#movieAddPlot").val(movieData.Plot);
  $("#movieAddPoster").val(movieData.Poster);
  $("#movieAddRating").val(movieData.imdbRating);
  }else{

  $("#notFound").html("<strong>Movie not found. <br> Please manually enter the infomation below, or try a different movie. </strong>");
  }
}


