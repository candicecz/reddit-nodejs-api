'use strict'
var bcrypt = require('bcrypt-as-promised');
var HASH_ROUNDS = 10;

class RedditAPI {
    constructor(conn) {
        this.conn = conn;
    }

    createUser(user) {
        /*
        first we have to hash the password. we will learn about hashing next week.
        the goal of hashing is to store a digested version of the password from which
        it is infeasible to recover the original password, but which can still be used
        to assess with great confidence whether a provided password is the correct one or not
         */
        return bcrypt.hash(user.password, HASH_ROUNDS)
            .then(hashedPassword => {
                return this.conn.query('INSERT INTO users (username,password, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())', [user.username, hashedPassword]);
            })
            .then(result => {
                return result.insertId;
            })
            .catch(error => {
                // Special error handling for duplicate entry
                if (error.code === 'ER_DUP_ENTRY') {
                    throw new Error('A user with this username already exists');
                }
                else {
                    throw error;
                }
            });
    }
//This function creates posts with the user id, title ,subreddit id and url that the  user inputs
    createPost(post) {
        if(!post.subredditId){
          return Promise.reject(new Error("There is no subreddit id"));
        }
        return this.conn.query(
            `
            INSERT INTO posts (userId, title, subredditId, url, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, NOW(), NOW())`,
            [post.userId, post.title, post.subredditId, post.url]
        )
        .then(result => {
            return result.insertId;
        });
        // .catch(error => {
        //     throw error;
        // });
    }
//This functions returns the posts with associated info about the post, the user, the subreddit to which the post belongs and associated votes
    getAllPosts() {
        return this.conn.query(//order by posts.createdAt DESC?
            `
            SELECT
              posts.id,posts.title,posts.url,posts.userId, subredditId, posts.createdAt AS postCreatedAt,posts.updatedAt AS postUpdatedAt,
              users.username,users.createdAt,users.updatedAt,
              subreddits.name,subreddits.description,subreddits.createdAt as subredditsCreatedAt,subreddits.updatedAt as subredditUpdatedAt,
              COALESCE(SUM(votes.voteDirection)) AS voteScore,
              SUM(IF(votes.voteDirection = 1, 1, 0)) AS numUpvotes,
              SUM(IF(votes.voteDirection = -1, 1, 0)) AS numDownvotes
            FROM posts
              JOIN users ON posts.userId = users.id
              JOIN subreddits ON posts.subredditId = subreddits.id
              LEFT JOIN votes ON posts.id = votes.postId
            GROUP BY posts.id
            ORDER BY voteScore DESC
            LIMIT 25`
        ).then(function(result){
          //console.log(result, "our query raw result")
          var formattedResult = result.map(function(x){
            var postsInfo ={
              id: x.id,
              title: x.title,
              url: x.url,
              createdAt: x.postCreatedAt,
              updatedAt: x.postUpdatedAt,
              voteScore: x.voteScore,
              user: {
                id: x.userId,
                username: x.username,
                createdAt: x.createdAt,
                updatedAt: x.updatedAt
              },
              subreddit: {
                id: x.subredditId,
                subredditName: x.name,
                description: x.description,
                createdAt: x.subredditsCreatedAt,
                updatedAt: x.subredditUpdatedAt
              }
            }
            return postsInfo;
          })
          return formattedResult;
        });
    }
//this creates a subreddit with a name and description as input by the user
    createSubreddit(subreddit){
      return this.conn.query('INSERT INTO subreddits (name,description,createdAt,updatedAt) VALUES (?,?,NOW(),NOW())',
      [subreddit.name,subreddit.description]
    ).then(result => {
        return result.insertId;
    }).catch(error => {
      if(error.code === 'ER_DUP_ENTRY'){
        throw new Error('A subreddit with this name already exists');
      }
      else{
        throw error;
      }
    });
    }
//this function returns all the subreddits ordered by time of creation (newest first) along with the associated info
    getAllSubreddits(){
      return this.conn.query(`
        SELECT subreddits.id, subreddits.name, subreddits.description, subreddits.createdAt, subreddits.updatedAt
        FROM subreddits
        ORDER BY subreddits.createdAt DESC
        `).then(function(result){
          return result;
        })
    }

//this function executes the voting system. Note that a vote of 1 is a positive vote and -1 is a negative vote. Together, these are summed in the
//getAllPosts funtion to find the voteScore. Note that a user can only vote for a given post once, however this function allows for the user
// to change their vote so that it is not considered a "second"vote.
    createVote(vote){
      if(vote.voteDirection < -1 || vote.voteDirection > 1){
        throw new Error('wrong vote count');
      }
      else{
        return this.conn.query('INSERT INTO votes SET createdAt=NOW(), updatedAt=NOW(), postId=?, userId=?, voteDirection=? ON DUPLICATE KEY UPDATE voteDirection=?', //this allows our user to change their vote.
        [vote.postId,vote.userId,vote.voteDirection,vote.voteDirection]
        ).then(result => {

            return result.insertId;
        }
        ).catch(error => {
          throw error;
          });
      }

    }
  }
    //this function takes the users comments and inputs into the comments table.
    // createComment(comment){
    //   return this.conn.query('INSERT INTO comments SET createdAt=NOW(), updatedAt=NOW(), userId =?, postId=?, parentId=?, text =?',
    //   [comment.userId,comment.postId,comment.parentId,comment.text]
    // ).then(result =>{
    //   if(!comment.parentId){
    //     comment.parentId === null;
    //   }
    //   return result.insertId;
    //   }
    // ).catch(error => {
    //   throw error;
    //   });
    // }

    // getCommentsForPosts(postId,levels){
    //   return this.conn.query(`
    //     SELECT comments.id, comments.postId, comments.parentId, comments.userId, comments.text, comments.createdAt, comments.updatedAt
    //     FROM comments
    //     WHERE parentId IS NULL
    //     `).then(function(result){
    //       var formattedResult = result.map(function(item){
    //           var commentsInfo ={
    //             userId: item.userId,
    //             text: item.text,
    //             createdAt: item.createdAt,
    //             updatedAt: item.updatedAt,
    //             replies: {
    //               // userId: item.userId,
    //               // text: item.text,
    //               // createdAt: item.createdAt,
    //               // updatedAt: item.updatedAt,
    //             }
    //         }
    //         return commentsInfo;
    //       })
    //     })
    //   }



module.exports = RedditAPI;
