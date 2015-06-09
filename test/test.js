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

    // function to be called before each test
    lab.beforeEach(function (done) {

        done();
    });

    test('it creates a new location for my locationpool', function (done) {
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
            },
            function (response) {
                expect(response.statusCode).to.equal(200);

                // rollback
                deleteTestLocation(response.result.id, done);
            }
        );
    });

    test('it returns an error when find by user id misses', function (done) {
        //TODO
        done();
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

function deleteTestLocation(id, done) {
    server.inject({
            method: 'DELETE',
            url: '/api/v1/users/my/locations/' + id
        },
        function (response) {
            expect(response.statusCode).to.equal(200);
            done();
        })
}
