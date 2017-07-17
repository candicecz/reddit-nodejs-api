require('dotenv').config()

// load the mysql library
var mysql = require('promise-mysql');

// create a connection to our Cloud9 server
var connection = mysql.createPool({
    host     : 'localhost',
    user     : 'root', // CHANGE THIS :)
    password : process.env.DB_PASS,
    database: 'reddit',
    connectionLimit: 10
});

// load our API and pass it the connection
var RedditAPI = require('./reddit');

var myReddit = new RedditAPI(connection);
// We call this function to create a new user to test our API
// The function will return the newly created user's ID in the callback
// myReddit.createUser({
//     username: 'PM_ME_CUTES3',
//     password: 'abc123'
// })
//     .then(newUserId => {
//         // Now that we have a user ID, we can use it to create a new post
//         // Each post should be associated with a user ID
//         console.log('New user created! ID=' + newUserId);
//
//         return myReddit.createPost({
//             title: 'Hello Reddit! This is my first post',
//             url: 'http://www.digg.com',
//             userId: newUserId
//         });
//     })
//     .then(newPostId => {
//         // If we reach that part of the code, then we have a new post. We can print the ID
//         console.log('New post created! ID=' + newPostId);
//         return
//     })
//     .catch(error => {
//         console.log(error.stack);
//     });
//This function will create a new post with its own subredditId and associated user id
// myReddit.createPost(
//   {userId: 1,title:"post 5 in subreddit 2", subredditId:2,url:"url"}
// ).then(function(){
//   connection.end()
// });

//this function will return all posts and associated info ordered by highest vote score.
// myReddit.getAllPosts()
// .then(function(results){
//   console.log(results);
//   connection.end()
// });
//this function will create a subreddit and description
// myReddit.createSubreddit(
//   {name:"subreddit2", description:"testing subreddits2"}
// ).then(function(){
//   connection.end()
// });
//this function will return all subreddits and associated info.
// myReddit.getAllSubreddits()
// .then(function(){
//   connection.end()
// });
// Calling the create vote where voteDirection has to be either -1, 0 or 1
// myReddit.createVote(
//   {postId:2, userId:1, voteDirection:1}
// ).then(function(results){
//   connection.end()
// });
//This function will create a comment where parentId is optional
// myReddit.createComment(
//   {userId: 1, postId: 3, text:'this is my comment with a parentId', parentId:1}
// ).then(function(result){
//   console.log(result)
//   connection.end()
// });
//This function with get the comments for a given postId

myReddit.getCommentsForPosts(1)
.then(function(){
  connection.end()
});
