'use strict';
var Code = require('code');
var Hapi = require('hapi');
var Lab = require('lab');
var Boom = require('boom');

// home made plugins
var Locationpool = require('../index');
var Database = require('ark-database');

// testing environment
var testDbeName = 'test';
var testEnv = require('./../env.json');
var testDbURL = 'http://locator.in.htwg-konstanz.de';
var testDbPort = 5984;

// Test shortcuts
var lab = exports.lab = Lab.script();
var expect = Code.expect;
var test = lab.test;

var id, server, locationpool;

// set up the whole test
lab.before(function (done) {

    var opt = {
        routes: {
            prefix: '/api/v1'
        }
    };

    // set up server
    server = new Hapi.Server();
    server.connection({host: 'localhost', port: 3030});

    // set up authentication
    server.auth.scheme('test', function (request, reply) {
        return {
            authenticate: function (request, reply) {
                return reply.continue({credentials: {_id: 'test'}});
            }
        }
    });
    server.auth.strategy('default', 'test');
    server.auth.default('default');

    // set up database with test params
    var db = new Database(testDbeName, testEnv.db, testDbURL, testDbPort);
    // register needed plugin
    var plugins = [db, new Locationpool()];
    server.register(plugins, opt, function (err) {
        if (err) {
            return done(err);
        }
        
        console.log('Set up complete');
        server.on('request-error', function (arg, err) {
            console.log('Error response (500) sent for request: ' + arg.id + ' because:\n' + err);
        });

        // start server and end set up
        server.start();
        done();
    });

});

// test the GET request for a location pool
lab.experiment('Locationpool Plugin creates a Location and', function () {

    lab.beforeEach(function (done) {

        createTestLocation(function (response) {

            // set global id for other test cases
            id = response.result.id;
            expect(response.statusCode).to.equal(200);
            done();
        });
    });

    lab.afterEach(function (done) {

        // rollback
        deleteTestLocation(id, function (response) {

            expect(response.statusCode).to.equal(200);
            done();
        });
    });


    test('it gets a location of my location pool', function (done) {

        getMyLocationById(id, function (response) {

            expect(response.statusCode).to.equal(200);
            done();
        });
    });

    test('it gets a location of my location pool, with invalid ID', function (done) {

        getMyLocationById('NOT_VALID', function (response) {

            expect(response.statusCode).to.equal(404);
            done();
        });
    });

    test('it gets a all of my locations', function (done) {

        getMyLocations(function (response) {

            expect(response.statusCode).to.equal(200);
            done();
        });
    });

    test('it deletes a location, which is not present', function (done) {

        deleteTestLocation('NOT_VALID_ID', function (response) {

            expect(response.result.statusCode).to.be.equal(400);
            expect(response.result.message).to.be.equal('CouchError: not_found: missing');
            done();
        })
    });

    test('it updates a location successfully', function (done) {

        updateTestLocation(id, function (res) {

            expect(res.statusCode).to.be.equal(200);
            done();
        })
    });


    test('it updates a not present location', function (done) {

        updateTestLocation('NOT_PRESENT', function (res) {

            expect(res.statusCode).to.be.equal(400);
            done();
        })
    });
});

// test the GET request for a location pool
lab.experiment('Locationpool Plugin creates a PreLocation with image and', function () {

    lab.beforeEach(function (done) {

        createTestLocationWithImage(function (response) {

            // set global id for other test cases
            id = response.result.id;
            expect(response.statusCode).to.equal(200);
            done();
        });
    });

    lab.afterEach(function (done) {

        // rollback
        deleteTestLocation(id, function (response) {

            expect(response.statusCode).to.equal(200);
            done();
        });
    });
});

lab.after(function (done) {
    console.log('Test complete');
    done();
});

// function for testing
function deleteTestLocation(id, callback) {
    server.inject({
        method: 'DELETE',
        url: '/api/v1/users/my/locations/' + id
    }, callback)
}

function createTestLocation(callback) {
    server.inject({
        method: 'POST',
        url: '/api/v1/users/my/locations',
        payload: {
            title: 'testLocation',
            description: 'testLocationDescription',

            city: {
                title: 'Konstanz',
                place_id: 'ChIJWx8MOBv2mkcR0JnfpbdrHwQ',
                id: '58433437e7710a957cd798b0774a79385389035b'
            },

            category: 'Bar',
            moods: ['TestMood']
        }
    }, callback)
}

function updateTestLocation(id, callback) {
    server.inject({
        method: 'PUT',
        url: '/api/v1/users/my/locations/' + id,
        payload: {
            title: 'testLocation',
            description: 'testLocationDescription',

            city: {
                title: 'Konstanz',
                place_id: 'ChIJWx8MOBv2mkcR0JnfpbdrHwQ',
                id: '58433437e7710a957cd798b0774a79385389035b'
            },

            category: 'Bar',
            moods: ['TestMood']
        }
    }, callback)
}

function getMyLocationById(id, callback) {
    server.inject({
        method: 'GET',
        url: '/api/v1/users/my/locations/' + id
    }, callback);
}

function getMyLocations(callback) {
    server.inject({
        method: 'GET',
        url: '/api/v1/users/my/locations'
    }, callback);
}

function getLocationById(id, callback) {
    server.inject({
        method: 'GET',
        url: '/api/v1/locations/' + id
    }, callback);
}

function createTestLocationWithImage(callback) {

}
