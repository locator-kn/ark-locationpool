export interface IRegister {
    (server:any, options:any, next:any): void;
    attributes?: any;
}

export default
class Locationpool {
    private joi:any;
    private boom:any;
    private db:any;
    private locationSchemePUT:any;
    private locationSchemePOST:any;

    constructor() {
        this.register.attributes = {
            pkg: require('./../../package.json')
        };
        this.joi = require('joi');
        this.boom = require('boom');

        this.initSchema();
    }

    register:IRegister = (server, options, next) => {
        server.bind(this);

        // set dependency to the database plugin
        server.dependency('ark-database', (server, next) => {
            this.db = server.plugins['ark-database'];
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
            path: '/users/my/locations',
            config: {
                handler: (request, reply) => {

                    this.db.getLocationsByUserId(request.auth.credentials._id, (err, data) => {
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
            }
        });


        server.route({
            method: 'GET',
            path: '/users/my/locations/{locationid}',
            config: {
                handler: (request, reply) => {
                    this.db.getLocationById(request.params.locationid, (err, data) => {
                        if (err) {
                            return reply(this.boom.create(400, err));
                        }
                        // check if the returned location belongs to this user
                        if (!data.owner) {
                            reply(this.boom.create(501, "come back later"));
                        }
                        if (data.owner !== request.auth.credentials._id) {
                            return reply(this.boom.create(403, "Not Authorized"));
                        }
                        return reply(data);
                    });
                },
                description: 'Get a single location of a user',
                notes: 'Returns a particular saved location of a user.',
                tags: ['api', 'locationpool'],
                validate: {
                    params: {
                        locationid: this.joi.string().required()
                    }
                }
            }
        });

        // POST
        server.route({
            method: 'POST',
            path: '/users/{userid}/locations',
            config: {
                handler: (request, reply) => {

                    // TODO: check if user exist

                    this.db.createLocation(request.params.userid, request.payload, (err, data) => {
                        if (err) {
                            return reply(this.boom.wrap(err, 400));
                        }
                        reply(data);
                    });
                },
                description: 'Post a single location for a user',
                tags: ['api', 'locationpool'],
                validate: {
                    payload: this.locationSchemePOST.required().description('Location JSON object'),
                    params: {
                        userid: this.joi.string().required()
                    }
                }
            }
        });

        // PUT
        server.route({
            method: 'PUT',
            path: '/users/{userid}/locations/{locationid}',
            config: {
                handler: (request, reply) => {
                    // TODO: check if user is authorized to change this location (is it his own location?)

                    this.db.updateLocation(request.payload._id, request.payload._rev, request.payload, (err, data) => {
                        if (err) {
                            return reply(this.boom.wrap(err, 400, err.details.message));
                        }
                        reply(data);
                    });
                },
                description: 'Update a single location for a user',
                tags: ['api', 'locationpool'],
                validate: {
                    payload: this.locationSchemePUT.required().description('Location JSON object'),
                    params: {
                        userid: this.joi.string().required(),
                        locationid: this.joi.string().required()
                    }
                }
            }
        });

        // DELETE
        server.route({
            method: 'DELETE',
            path: '/users/{userid}/locations',
            config: {
                handler: (request, reply) => {
                    // TODO: check if user is authorized to delete these locations (are these his own locations?)
                    this.db.deleteLocationsByUserId(request.params.userid, (err, data) => {
                        if (err) {
                            return reply(this.boom.wrap(err, 400));
                        }
                        reply(data);
                    });
                },
                description: 'Delete all locations of a user',
                notes: 'Deletes all locations',
                tags: ['api', 'locationpool'],
                validate: {
                    params: {
                        userid: this.joi.string().required()
                    }
                }
            }
        });

        server.route({
            method: 'DELETE',
            path: '/users/{userid}/locations/{locationid}',
            config: {
                handler: (request, reply) => {

                    // TODO: check if user is authorized to delete this location (is it his own location?)
                    this.db.deleteLocationById(request.params.locationid, (err, data) => {
                        if (err) {
                            return reply(this.boom.wrap(err, 400));
                        }
                        reply(data);
                    });
                },
                description: 'Delete a single location of a user',
                notes: 'Deletes a particular saved location of a user.',
                tags: ['api', 'locationpool'],
                validate: {
                    params: {
                        userid: this.joi.string().required(),
                        locationid: this.joi.string().required()
                    }
                }
            }
        });

        // Register
        return 'register';
    }

    /**
     * Create validation schema for location.
     */
    private initSchema():void {
        // basic schema
        this.locationSchemePOST = this.joi.object().keys({
            // TODO: better validator, regex???
            title: this.joi.string().required(),
            description: this.joi.string().required(),
            city: this.joi.string().required(),
            geotag: this.joi.object().keys({
                long: this.joi.string(),
                lat: this.joi.string()
            }),
            budget: this.joi.number(),
            pics: this.joi.array(), // TODO: could be better?
            category: this.joi.string(),
            type: this.joi.string().required().only('location')
        });

        this.locationSchemePUT = this.locationSchemePOST
            .concat(this.joi.object().keys({
                _id: this.joi.string().required(),
                _rev: this.joi.string().required()
            }));

    }
}
