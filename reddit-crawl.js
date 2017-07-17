var request = require('request-promise');
var mysql = require('promise-mysql');
var RedditAPI = require('./reddit');  ///accessing reddit.js

function getSubreddits() {
    return request('https://www.reddit.com/.json')
        .then(response => {
            // Parse response as JSON and store in variable called result
            var response= JSON.parse(response);

            // Use .map to return a list of subreddit names (strings) only
            return response.data.children.map(function(answer){
              var subreddit = answer.data.subreddit;
              return subreddit;
            })
        });
}


function getPostsForSubreddit(subredditName) {
    return request(`https://www.reddit.com/r/${subredditName}.json?limit=50`)
        .then(
            response => {
                var response = JSON.parse(response);
                // Parse the response as JSON and store in variable called result
               // continue this line
                return response.data.children
                    .filter(function(answer){
                      return !answer.data.is_self;
                      }) // Use .filter to remove self-posts
                    .map(function(item){
                      var titleOfPosts = {
                        title: item.data.title,
                        url: item.data.url,
                        user: item.data.author
                      }
                      return titleOfPosts;
                    }); // Use .map to return title/url/user objects only
            }
        );

}

function crawl() {
    // create a connection to the DB
    var connection = mysql.createPool({
        host     : 'localhost',
        user     : 'root',
        password : 's8q9l0',
        database: 'reddit',
        connectionLimit: 10
    });

    // create a RedditAPI object. we will use it to insert new data
    var myReddit = new RedditAPI(connection);

    // This object will be used as a dictionary from usernames to user IDs
    var users = {};

    // getSubreddits()
    // .then(result => {
    //   console.log(result, "subreddit result")
    // })
    // .catch(err =>{
    //   console.log(err, "ERROR")
    // })
    /*
    Crawling will go as follows:

        1. Get a list of popular subreddits
        2. Loop thru each subreddit and:
            a. Use the `createSubreddit` function to create it in your database
            b. When the creation succeeds, you will get the new subreddit's ID
            c. Call getPostsForSubreddit with the subreddit's name
            d. Loop thru each post and:
                i. Create the user associated with the post if it doesn't exist
                2. Create the post using the subreddit Id, userId, title and url
     */

    // Get a list of subreddits
    getSubreddits()
        .then(subredditNames => {
            subredditNames.forEach((subredditName, index) => {
				// console.log(subredditName + " with the index " + index + "and it's a " + typeof subredditName)
                var subId;
                myReddit.createSubreddit({name: subredditName})
                    .then(subredditId => {
						console.log(subredditId + 'after creation');
                        subId = subredditId;
						// console.log(subId);
                        return getPostsForSubreddit(subredditName)
                    })
                    .then(posts => {
                        posts.forEach(post => {
                            var userIdPromise;
                            if (users[post.user]) {
                                userIdPromise = Promise.resolve(users[post.user]);
                            }
                            else {
                                userIdPromise = myReddit.createUser({
                                    username: post.user,
                                    password: 'abc123'
                            })
                            .catch(function(err) {
                                    return users[post.user];
                                })
                            }

                            userIdPromise.then(userId => {
                                users[post.user] = userId;
                                return myReddit.createPost({
                                    subredditId: subId,
                                    userId: userId,
                                    title: post.title,
                                    url: post.url
                                });
                            });
                        });
                    });
            });
        });
}
crawl();
