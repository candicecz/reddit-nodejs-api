var express = require('express');
var app = express();
var fs = require('fs');
var mysql = require('promise-mysql');
var bodyParser = require('body-parser');
path = require('path')

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
app.use(express.static(path.join(__dirname, 'static_files')))
//view engine
app.set('view engine', 'pug');

//homepage
app.get('/', function (req, res) {
  res.send('Hello World!');
});

//hello page where user name can be customized
app.get('/hello', function (req, res) {
  if(!req.query.name){
    res.send(`<!doctype.html>
      <h1>Hello World!</h1>`);
  }
  else {
  res.send(`<!doctype.html>
    <h1>Hello ` + req.query.name + `!</h1>`);
  }
});

//calculator page whereby we can add or multiply 2 numbers
app.get('/calculator/:operation', function(req,res){
    var calculationObj = {
      operation: req.params.operation,
      firstOperand: parseInt(req.query.num1),
      secondOperand: parseInt(req.query.num2),
    }
    if(calculationObj.operation == 'add'){
      calculationObj.total = calculationObj.firstOperand + calculationObj.secondOperand;
      res.json(calculationObj);
    }
    else if(calculationObj.operation == 'multiply'){
      calculationObj.total = calculationObj.firstOperand * calculationObj.secondOperand;
      res.json(calculationObj);
    }
    else {
      res.status(400); // unauthorized
      res.end('bad request');
    }
});

//page returning all the reddit posts
app.get('/posts', function(req,res){
  myReddit.getAllPosts()
  .then(function(posts){
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
  });
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
app.post('/createPost',function(req,res){
  myReddit.createPost(
    {
      userId: 1,
      title:req.body.title,
      subredditId:2,
      url:req.body.url
    }
  )
  res.redirect('/new-post')
});

/* YOU DON'T HAVE TO CHANGE ANYTHING BELOW THIS LINE :) */

// Boilerplate code to start up the web server
var server = app.listen(3333, function () {
  console.log('Example app listening at http://3333');
});
// var server = app.listen(process.env.PORT, process.env.IP, function () {
//   console.log('Example app listening at http://%s', process.env.C9_HOSTNAME);
// });
