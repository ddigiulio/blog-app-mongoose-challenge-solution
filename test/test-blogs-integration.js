const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const should = chai.should();

const { BlogPost } = require('../models');
const { app, runServer, closeServer } = require('../server');
const { TEST_DATABASE_URL } = require('../config');

chai.use(chaiHttp);

function seedBlogData() {
    console.info('seeding blog data');
    let exec = require('child_process').exec
    let command = 'mongoimport --db test-blog-app --collection blogposts --drop --file seed-data.json'
    exec(command, (err, stdout, stderr) => {
        // check for errors or if it was succesfuly
    })
}

function generateBlogData() {
    return {
        author: {
            firstName: "Danny",
            lastName: "Di Giulio"
        },
        content: "hi",
        title: "I AM THE BEST",
    }
}

function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
}

describe('Blog API resource', function () {

    // we need each of these hook functions to return a promise
    // otherwise we'd need to call a `done` callback. `runServer`,
    // `seedRestaurantData` and `tearDownDb` each return a promise,
    // so we return the value returned by these function calls.
    before(function () {
        return runServer(TEST_DATABASE_URL);
    });

    beforeEach(function () {
        return seedBlogData();
    });

    afterEach(function () {
        return tearDownDb();
    });

    after(function () {
        return closeServer();
    })

    describe('GET endpoint', function () {

        it('should return all existing blogs', function () {

            let res;
            return chai.request(app)
                .get('/posts')
                .then(function (_res) {
                    res = _res;
                    res.should.have.status(200);
                    res.body.posts.should.have.length.of.at.least(1);
                    return BlogPost.count();
                })
                .then(function (count) {
                    res.body.posts.should.have.length.of(count);
                });
        });

        it('should return blogs with right fields', function () {
            console.log("checking for fields");
            let resBlogPost;
            return chai.request(app)
                .get('/posts')
                .then(function (res) {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.posts.should.be.a('array');
                    res.body.posts.should.have.length.of.at.least(1);

                    res.body.posts.forEach(function (blogpost) {
                        blogpost.should.be.a('object');
                        blogpost.should.include.keys(
                            'author', 'title', 'content')
                    });
                    resBlogPost = res.body.posts[0];
                    return BlogPost.findById(resBlogPost.id);
                })
                .then(function(blogpost){
                    blogpost = blogpost.apiRepr();
                    resBlogPost.author.should.equal(blogpost.author);
                    resBlogPost.title.should.equal(blogpost.title);
                    resBlogPost.content.should.equal(blogpost.content);

                });
        });

    });

    describe('POST endpoint', function () {
        it('should add a new blogpost', function () {

            const newBlogPost = generateBlogData();

            return chai.request(app)
                .post('/posts')
                .send(newBlogPost)
                .then(function (res) {
                    res.should.have.status(201);
                    res.should.be.json;
                    res.body.should.be.a('object');
                    res.body.should.include.keys(
                        'title', 'author', 'content');
                    res.body.id.should.not.be.null;
                    res.body.title.should.equal(newBlogPost.title);
                    res.body.content.should.equal(newBlogPost.content);

                       return BlogPost.findById(res.body.id);
                })
            .then(function(blogpost) {
              blogpost.content.should.equal(newBlogPost.content);
              blogpost.title.should.equal(newBlogPost.title);
            
            });
        });
    });

    describe('PUT endpoint', function() {

    it('should update fields you send over', function() {
      const updateData = {
        title: 'Dr. DooLittle',
        content: 'a great book'
      };

      return BlogPost
        .findOne()
        .exec()
        .then(function(blogpost) {
          updateData.id = blogpost.id;
          console.log(blogpost.id);
          return chai.request(app)
            .put(`/posts/${blogpost.id}`)
            .send(updateData);
        })
        .then(function(res) {
          res.should.have.status(204);

          return BlogPost.findById(updateData.id).exec();
        })
        .then(function(blogpost) {
         blogpost.content.should.equal(updateData.content);
          blogpost.title.should.equal(updateData.title);
        });
      });
  });

    describe('DELETE endpoint', function() {
    
    it('delete a blogpost by id', function() {

      let blogpost;

      return BlogPost
        .findOne()
        .exec()
        .then(function(_blogpost) {
          blogpost = _blogpost;
          return chai.request(app).delete(`/posts/${blogpost.id}`);
        })
        .then(function(res) {
          res.should.have.status(204);
          return BlogPost.findById(blogpost.id).exec();
        })
        .then(function(_blogpost) {
        .
          should.not.exist(_blogpost);
        });
    });
  });


})