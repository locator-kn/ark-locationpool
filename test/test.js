var Plugin = require('../index');
var Code = require('code');
var Hapi = require('hapi');
var Lab = require('lab');
// Test shortcuts
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;


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

var request, server;

// set up the whole test
lab.before(function (done) {

    // set up server
    server = new Hapi.Server();
    server.connection({host: 'localhost', port: 80});

    // register needed plugins
    var plugins = [new Plugin()];
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

    lab.test('it returns a not found when find by user id misses', function (done) {
        // stub location

        // send the request to the server
        server.inject(request, function (response) {
            expect(response.statusCode).to.equal(404);
            done();
        });
    });

    lab.test('it returns an error when find by user id misses', function (done) {

        done();
    });

    lab.test('it returns an error when find by location id misses', function (done) {

        done();
    });

    lab.test('it returns a not found when find by location id misses', function (done) {

        done();
    });

    lab.test('it returns a document successfully', function (done) {

        done();
    });

});