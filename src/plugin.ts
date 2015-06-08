declare
var Promise:any;

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
    private regex:any;

    constructor() {
        this.register.attributes = {
            pkg: require('./../../package.json')
        };
        this.joi = require('joi');
        this.boom = require('boom');
        this.regex = require('locator-image-utility').regex;

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
                    this.db.getLocationsByUserId(request.auth.credentials._id)
                        .then(value => reply(value))
                        .catch(err => reply(err));
                },
                description: 'Get the location pool of a user',
                notes: 'Return a list of all saved  location of a user.',
                tags: ['api', 'locationpool']
            }
        });


        server.route({
            method: 'GET',
            path: '/users/my/locations/{locationid}',
            config: {
                auth: false,
                handler: (request, reply) => {
                    this.db.getgetLocationById(request.params.locationid)
                        .then(value => reply(value))
                        .catch(err => reply(err));
                },
                description: 'Get a single location of a user. Convenience route: Same as calling /locations/:locationId',
                notes: 'Returns a particular saved location of a user.',
                tags: ['api', 'locationpool'],
                validate: {
                    params: {
                        locationid: this.joi.string().required()
                    }
                }
            }
        });

        server.route({
            method: 'GET',
            path: '/locations/{locationid}',
            config: {
                auth: false,
                handler: (request, reply) => {
                    this.db.getLocationById(request.params.locationid)
                        .then(value => reply(value))
                        .catch(err => reply(err));
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

        server.route({
            method: 'GET',
            path: '/locations/{locationid}/{name}.{ext}',
            config: {
                auth: false,
                handler: (request, reply) => {
                    // create file name
                    var file = request.params.name + '.' + request.params.ext;

                    // get and reply file stream from database
                    reply(this.db.getPicture(request.params.locationid, file));
                },
                description: 'Get a picture of a location',
                notes: 'sample call: /locations/1222123132/locationTitle-trip.jpg. The url is found, when a ' +
                'location is requested with GET /locations/:locationID or GET /users/my/locations',
                tags: ['api', 'trip'],
                validate: {
                    params: {
                        locationid: this.joi.string()
                            .required(),
                        name: this.joi.string()
                            .required(),
                        ext: this.joi.string()
                            .required().regex(this.regex.imageExtension)
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

                    request.payload.userid = request.auth.credentials._id;
                    request.payload.type = "location";

                    this.db.createLocation(request.payload)
                        .then(value =>  reply({messages: 'success', id: value.id}))
                        .catch(error =>  reply(this.boom.badRequest(error)));
                },
                description: 'Create a single location for a user',
                tags: ['api', 'locationpool'],
                validate: {
                    payload: this.locationSchemePOST.required()
                        .description('Location JSON object')
                }
            }
        });

        // PUT
        server.route({
            method: 'PUT',
            path: '/users/my/locations/{locationid}',
            config: {
                handler: (request, reply) => {
                    this.db.updateLocation(request.params.locationid, request.auth.credentials._id, request.payload)
                        .then(value => reply(value))
                        .catch(err => reply(err));
                },
                description: 'Update a single location of a user',
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
        // should this route be provided? delete all trips??
        //server.route({
        //    method: 'DELETE',
        //    path: '/users/my/locations',
        //    config: {
        //        handler: (request, reply) => {
        //            this.db.deleteLocationsByUserId(request.auth.credentials._id, (err, data) => {
        //                if (err) {
        //                    return reply(this.boom.wrap(err, 400));
        //                }
        //                reply(data);
        //            });
        //        },
        //        description: 'Delete all locations of a user',
        //        notes: 'Deletes all locations',
        //        tags: ['api', 'locationpool']
        //    }
        //});

        server.route({
            method: 'DELETE',
            path: '/users/my/locations/{locationid}',
            config: {
                handler: (request, reply) => {
                    this.db.deleteLocationById(request.params.locationid, request.auth.credentials._id)
                        .then(value => reply(value))
                        .catch(err => reply(err));
                },
                description: 'Delete a single location of a user',
                notes: 'Deletes a particular saved location of a user.',
                tags: ['api', 'locationpool'],
                validate: {
                    params: {
                        locationid: this.joi.string().required()
                    }
                }
            }
        });

        // Register
        return 'register';
    }

    /**
     * Utility method for checking if the given userid belongs to the given locationid
     * @param userid
     * @param tripid
     * @returns {Promise|Promise<T>}
     */
    private isItMyLocation(userid:string, locationid:string):any {
        return new Promise((reject, resolve) => {

            this.db.getLocationById(locationid, (err, data) => {

                if (err) {
                    return reject(this.boom.badRequest(err));
                }

                if (!data.userid || data.userid !== userid) {
                    return reject(this.boom.forbidden());
                }

                return resolve(data);
            });
        });
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
            title: this.joi.string(),
            description: this.joi.string(),
        })

    }
}
