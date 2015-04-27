'use strict';
var Code = require('code');
var Hapi = require('hapi');
var Lab = require('lab');
var sinon = require('sinon');

// home made plugins
var Locationpool = require('../index');
var Database = require('backend-database');

// Test shortcuts
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;
var test = lab.test;

var request, server, locationpool, database;

// set up the whole test
lab.before(function (done) {

    // set up server
    server = new Hapi.Server();
    server.connection({host: 'localhost', port: 3030});

    locationpool = new Locationpool();
    database = sinon.mock(new Database());
    console.log("woop");
    //
    //sinon.stub(database.location, 'getLocationById', function (callback) {
    //    return '';
    //});

    // register needed plugins
    var plugins = [locationpool, database];
    server.register(plugins, function (err) {
        if (err) {
            return done(err);
        }
        done();
    });
});

// test the GET request for a location pool
lab.experiment('Locationpool Plugin GET location', function () {

    // function to be called before each test
    lab.beforeEach(function (done) {

        request = {
            method: 'GET',
            url: '/user/4386558346954769843/locations/98534650973650'
            //credentials: AuthenticatedUser
        };
        done();
    });

    test('it returns a not found when find by user id misses', function (done) {


        // send the request to the server
        server.inject(request, function (response) {
            expect(response.statusCode).to.equal(404);
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


describe('Plugin', function () {
    it('should work', function (done) {
        var server = new Hapi.Server();
        var plugin = new Plugin();
        server.connection({host: 'localhost', port: 80});

        server.register(plugin, function (err) {
            expect(err).to.not.exist();
            expect(plugin._register).to.be.a.function();
            expect(plugin._register()).to.be.a.string();
            done();
        });
    });
});