var express = require('express');
var app = express();
var fs = require('fs');
var mysql = require('promise-mysql');
var bodyParser = require('body-parser');
path = require('path')

//require reddit database
var RedditAPI = require('./reddit');


//create a connection to the database
var connection = mysql.createPool({
    host     : 'localhost',
    user     : 'root',
    password : 's8q9l0',
    database: 'reddit',
    connectionLimit: 10
});
//establishes reddit new connection
var myReddit = new RedditAPI(connection);

//BodyParser Middleware writing the documentation for bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

//Static Middleware
app.use('/files', express.static('static_files'))

//view engine
app.set('view engine', 'pug');

//homepage that says hello world (exercise1) using es6
app.get('/', (req, res) => {
  res.send('Hello World!');
});

//hello page where user name can be customized
//note res.send is not return so it does not exit a function when you say res.send
app.get('/hello', (req, res) => {
  if(!req.query.name){
    res.send(`<!doctype.html><h1>Hello World!</h1>`);
  }
  else {
  res.send(`<!doctype.html><h1>Hello ` + req.query.name + `!</h1>`);
  }
});

//calculator page whereby we can add or multiply 2 numbers
//why did we choose a path parameter :operation that a question of url structure which is something maybe more of a senior developer would
// decide on with a team but its good to look up at some point

// even though json is related to javascript, but theres a difference between a javascript object and  a json object which is like a painting
// of a javascript object. it borrows from javascript but its not linked more than that. many languages have a way of decoding json. json parse takes a
// string of json and returns the  data. json stringify takes data and makes it a string. so here res.json is stringifying.
app.get('/calculator/:operation', (req,res) => {
  var num1 = +req.query.num1; //here + works like parseInt
  var num2 = +req.query.num2;
  var op = req.params.operation;
  if(op!=='add' && op!=='multiply'){
    res.status(400).json({error:'operation must be of add or multiply'});
    return;
  };
  var calculationObj = {
      operation: op,
      firstOperand: num1,
      secondOperand: num2,
      solution: op === 'add' ? num1 + num2 : num1 * num2
    };
    res.json(calculationObj);
});

//page returning all the reddit posts
//makes  a request to db, iterate over the result and builds html, send html to client
app.get('/posts', function(req,res){
  myReddit.getAllPosts()
  .then(posts => {
    res.render('post-list', {posts: posts});
  // var htmlString =`<!doctype.html>
  //   <h1Testing our posts</h1>
  //   <ul>
  //   `
  // myReddit.getAllPosts()
  // .then(function(result){
  //
  //   result.forEach(post =>{
  //     htmlString += `
  //     <li class="post-item">
  //       <h2 class="post-item__title">
  //         <a href="${post.url}">${post.title}</a>
  //       </h2>
  //       <p>Created by ${post.user.username}</p>
  //     </li>
  //     `
  //   })
  // var postHtmlString=  htmlString + `/<ul>`
  //   res.send(postHtmlString)
  //  });
  }).catch(err => {
  res.status(500).send(err.stack);
  })
});

//create post functionality
app.get('/new-post',function(req,res){
  res.render('create-content');
  // res.send(`<!doctype.html>
  //   <form action="/createPost" method="POST">
  //   <p>
  //     <input type="text" name="url" placeholder="Enter a URL to content">
  //   </p>
  //   <p>
  //     <input type="text" name="title" placeholder="Enter the title of your content">
  //   </p>
  //   <button type="submit">Create!</button>
  // </form>
  //   `);
});
//catching the submission from the new post
app.post('/createPost', bodyParser.urlencoded({extended:false}),(req,res) =>{
  myReddit.createPost({
      userId: 1,
      title:req.body.title,
      subredditId:2,
      url:req.body.url
    })
  res.redirect('/new-post')
});
//because if you refresh the page it will count it as a new createPost with no info. So we want to redirect ppl because if they refresh, they will
//refresh on a page that has a GET method, not a POST method so they wont be adding more blank posts.
//basically always redirect after post request.

/* YOU DON'T HAVE TO CHANGE ANYTHING BELOW THIS LINE :) */

// Boilerplate code to start up the web server
var server = app.listen(3333, function () {
  console.log('Example app listening at http://localhost:3333');
});
// var server = app.listen(process.env.PORT, process.env.IP, function () {
//   console.log('Example app listening at http://%s', process.env.C9_HOSTNAME);
// });
