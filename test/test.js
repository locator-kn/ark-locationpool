'use strict';
var Code = require('code');
var Hapi = require('hapi');
var Lab = require('lab');

// home made plugins
var Locationpool = require('../index');
var Database = require('ark-database');

// Test shortcuts
var lab = exports.lab = Lab.script();
var expect = Code.expect;
var test = lab.test;

var request, server, locationpool, database;

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

    // register needed plugin
    var plugins = [new Database('test'), new Locationpool()];
    server.register(plugins, opt, function (err) {
        if (err) {
            return done(err);
        }
        done();
    });

    // TODO set up database with needed design documents

    console.log('Set up complete');
    server.on('request-error', function(arg,err) {
        console.log('Error response (500) sent for request: ' + arg.id + ' because:\n' + err);
    });
    server.start();


});

// test the GET request for a location pool
lab.experiment('Locationpool Plugin GET location', function () {

    // function to be called before each test
    lab.beforeEach(function (done) {

        request = {
            method: 'GET',
            url: '/api/v1/users/my/locations'
        };
        done();
    });

    test('it returns a not found when find by user id misses', function (done) {


        // send the request to the server
        server.inject(request, function (response) {
           // console.log(arguments)
            expect(response.statusCode).to.equal(200);
            done();
        });
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
