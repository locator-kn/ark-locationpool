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

        done();
    });

    lab.test('it returns a not found when find by location id misses', function (done) {

        done();
    });

    lab.test('it returns a not found when find by user id misses', function (done) {

        done();
    });

    lab.test('it returns a not found when find by location id misses', function (done) {

        done();
    });

    lab.test('it returns a document successfully', function (done) {

        done();
    });

});