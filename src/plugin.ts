export interface IRegister {
    (server:any, options:any, next:any): void;
    attributes?: any;
}

export default
class Locationpool {
    private joi:any;
    private boom:any;
    private db:any;
    private locationSchemePOST:any;
    private locationSchemePUT:any;

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
                        if (!data.owner) {
                            reply(this.boom.create(501, "come back later"));
                        }

                        // check if the returned location belongs to this user
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
            path: '/users/my/locations',
            config: {
                handler: (request, reply) => {

                    request.payload.owner = request.auth.credentials._id;
                    request.payload.type = "location";

                    var locationID;

                    this.db.createLocation(request.payload).then(value => {
                            locationID = value.id;
                            return this.db.updateLocationOfUser(request.auth.credentials._id, locationID);
                        }).then(value => {
                            return reply({messages: 'success', id: locationID})
                        }).catch(error => {
                            return reply(this.boom.wrap(error, 400));
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
            path: '/users/my/locations/{locationid}',
            config: {
                handler: (request, reply) => {
                    this.db.updateLocation(request.auth.credentials._id, request.params.locationid, request.payload, (err, data) => {
                        if (err) {
                            return reply(err);
                        }
                        return reply(data);
                    });
                },
                description: 'Update a single location for a user',
                tags: ['api', 'locationpool'],
                validate: {
                    payload: this.locationSchemePUT.required().description('Location JSON object'),
                    params: {
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
            category: this.joi.string(),
        });

        this.locationSchemePUT = this.joi.object().keys({
            title: this.joi.strig(),
            description: this.joi.string(),
        })

    }
}
