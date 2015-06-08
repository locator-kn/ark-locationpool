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
                notes: 'Return a list of all saved  location of a user.',
                tags: ['api', 'locationpool']
            }
        });


        server.route({
            method: 'GET',
            path: '/users/my/locations/{locationid}',
            config: {
                handler: (request, reply) => {
                    this.isItMyLocation(request.auth.credentials._id, request.params.locationid)
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

    private isItMyLocation(userid:string, locationid:string):Promise {

        return new Promise((reject, resolve) => {
            // first, get the location
            this.db.getLocationById(locationid, (err, data) => {

                if (err) {
                    return reject(this.boom.badRequest(err));
                }

                // check if the returned location belongs to this user
                if (data.userid !== userid) {
                    return reject(this.boom.forbidden());
                }

                return resolve(data);
            });
        });
    }

    private notAuthorized(err:any, reply:any):void {
        if (err) {
            return reply(this.boom.create(400, err));
        }
        return reply(this.boom.create(403, "Not Authorized"));
    }
}
