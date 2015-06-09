'use strict';
var Code = require('code');
var Hapi = require('hapi');
var Lab = require('lab');

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

var request, server, locationpool;

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
        done();
    });

    // TODO set up database with needed design documents

    console.log('Set up complete');
    server.on('request-error', function (arg, err) {
        console.log('Error response (500) sent for request: ' + arg.id + ' because:\n' + err);
    });
    server.start();


});

// test the GET request for a location pool
lab.experiment('Locationpool Plugin GET location', function () {

    test('it creates a new location for my locationpool', function (done) {
        createTestLocation(function (response) {
            // test
            expect(response.statusCode).to.equal(200);

            // rollback
            deleteTestLocation(response.result.id, function (response) {
                // test rollback
                expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });


    test('it gets a location of my location pool, which is previously created', function (done) {
        createTestLocation(function (response) {
            // test
            expect(response.statusCode).to.equal(200);

            getMyLocationById(response.result.id, function (response) {
                expect(response.statusCode).to.equal(200);

                // rollback
                deleteTestLocation(response.result._id, function (response) {
                    // test rollback
                    expect(response.statusCode).to.equal(200);
                    done();
                });
            })

        });
    });

    test('it deletes a location, which is not present', function (done) {
        deleteTestLocation('NOT_VALID_ID', function (response) {
            expect(response.result.statusCode).to.be.equal(400);
            expect(response.result.message).to.be.equal('CouchError: not_found: missing');
            done();
        })
    });


    test('it returns an error when find by location id misses', function (done) {
        //TODO
        done();
    });

    test('it returns a not found when find by location id misses', function (done) {
        //TODO
        done();
    });

    test('it returns a document successfully', function (done) {
        //TODO
        done();
    });

});

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

function getMyLocationById(id, callback) {
    server.inject({
        method: 'GET',
        url: '/api/v1/users/my/locations/' + id
    }, callback);
}


function getLocationById(id, callback) {
    server.inject({
        method: 'GET',
        url: '/api/v1/locations/' + id
    }, callback);
}
