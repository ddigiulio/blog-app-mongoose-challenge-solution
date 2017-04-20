const chai = require('chai');
const chaiHttp = require('chai-http');

const mongoose = require('mongoose');

const should = chai.should();

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

function seedBlogData() {
    console.info('seeding blog data');
    let exec = require('child_process').exec
    let command = 'mongoimport --db test-blog-app --collection blogposts --drop --file seed-data.json'
    exec(command, (err, stdout, stderr) => {
        // check for errors or if it was succesfuly
        console.log("?");
    })
}

describe('Blog API resource', function() {

  // we need each of these hook functions to return a promise
  // otherwise we'd need to call a `done` callback. `runServer`,
  // `seedRestaurantData` and `tearDownDb` each return a promise,
  // so we return the value returned by these function calls.
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedBlogData();
  });

//   afterEach(function() {
//     return tearDownDb();
//   });

  after(function() {
    return closeServer();
  })

describe('GET endpoint', function() {

    it('should return all existing blogs', function() {
      // strategy:
      //    1. get back all restaurants returned by by GET request to `/restaurants`
      //    2. prove res has right status, data type
      //    3. prove the number of restaurants we got back is equal to number
      //       in db.
      //
      // need to have access to mutate and access `res` across
      // `.then()` calls below, so declare it here so can modify in place
      let res;
      return chai.request(app)
        .get('/posts')
        .then(function(_res) {
          // so subsequent .then blocks can access resp obj.
          res = _res;
          res.should.have.status(200);
          // otherwise our db seeding didn't work
          res.body.restaurants.should.have.length.of.at.least(1);
          return BlogPost.count();
        })
        .then(function(count) {
          res.body.restaurants.should.have.length.of(count);
        });
    });

  });

})