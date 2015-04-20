export interface IRegister {
    (server:any, options:any, next:any): void;
    attributes?: any;
}

export default
class Locationpool {
    private joi:any;
    private boom:any;
    private db:any;

    constructor() {
        this.register.attributes = {
            name: 'backend-locationpool',
            version: '0.1.0'
        };
        this.joi = require('joi');
        this.boom = require('Boom');

        // TODO: create validation scheme with joi
    }

    register:IRegister = (server, options, next) => {
        server.bind(this);

        // set dependency to the database plugin
        server.dependency('backend-database', (server, next) => {
            this.db = server.plugins['backend-database'];
            next();
        });

        this._register(server, options);
        next();
    };

    private _register(server, options) {
        //register all routes

        // GET
        server.route({
            method: 'GET',
            path: '/user/{userid}/locations',
            config: {
                handler: (request, reply) => {
                    // TODO: check user id???
                    this.db.getLocationsByUserId(request.params.userid, (err, data) => {
                        if (err) {
                            return reply(this.boom.wrap(err, 400));
                        }
                        reply(data);
                    });
                },
                description: 'Get the location pool of a user',
                notes: 'Return a list of all saved (lightweight) location of a user. Lightweight means that the ' +
                'pictures are only returned as small thumbnails.',
                tags: ['api', 'locationpool']
                // TODO: validate
            }
        });

        server.route({
            method: 'GET',
            path: '/user/{userid}/locations/{locationsid}',
            config: {
                handler: (request, reply) => {
                    this.db.getLocationById(request.params.locationid, (err, data) => {
                        if (err) {
                            return reply(this.boom.wrap(err, 400));
                        }
                        reply(data);
                    });
                },
                description: 'Get a single location of a user',
                notes: 'Returns a particular saved location of a user.',
                tags: ['api', 'locationpool']
                // TODO: validate
            }
        });

        // POST
        server.route({
            method: 'POST',
            path: '/user/{userid}/locations',
            config: {
                handler: (request, reply) => {
                    // TODO
                    reply('HUHU');
                },
                description: 'Post a single location for a user',
                tags: ['api', 'locationpool']
                // TODO: validate
            }
        });

        // PUT
        server.route({
            method: 'PUT',
            path: '/user/{userid}/locations/{locationsid}',
            config: {
                handler: (request, reply) => {
                    // TODO
                    reply('HUHU');
                },
                description: 'Update a single location for a user',
                tags: ['api', 'locationpool']
            }
        });

        // DELETE
        server.route({
            method: 'DELETE',
            path: '/user/{userid}/locations',
            config: {
                handler: (request, reply) => {
                    this.db.deleteLocationsByUserId(request.params.userid, (err, data) => {
                        if (err) {
                            return reply(this.boom.wrap(err, 400));
                        }
                        reply(data);
                    });
                },
                description: 'Delete all locations of a user',
                notes: 'Deletes all locations',
                tags: ['api', 'locationpool']
                // TODO: validate
            }
        });

        server.route({
            method: 'DELETE',
            path: '/user/{userid}/locations/{locationsid}',
            config: {
                handler: (request, reply) => {
                    this.db.deleteLocationById(request.params.locationid, (err, data) => {
                        if (err) {
                            return reply(this.boom.wrap(err, 400));
                        }
                        reply(data);
                    });
                },
                description: 'Delete a single location of a user',
                notes: 'Deletes a particular saved location of a user.',
                tags: ['api', 'locationpool']
                // TODO: validate
            }
        });

        // Register
        return 'register';
    }

    errorInit(error) {
        if (error) {
            console.log('Error: Failed to load plugin (Locationpool):', error);
        }
    }
}