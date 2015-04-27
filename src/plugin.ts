export interface IRegister {
    (server:any, options:any, next:any): void;
    attributes?: any;
}

export interface ILocationpool {
    _id: string;
    _rev?: string;
    title: string;
    description: string;
    city: string;
    geotag: string; // TODO: string??
    budget: number;
    pics: string[];
    category: string;
    type: string;
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
            name: 'backend-locationpool',
            version: '0.1.0'
        };
        this.joi = require('joi');
        this.boom = require('Boom');

        this.initSchema();
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
                tags: ['api', 'locationpool'],
                validate: {
                    params: {
                        userid: this.joi.string().required()
                    }
                }
            }
        });


        server.route({
            method: 'GET',
            path: '/user/{userid}/locations/{locationid}',
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
                tags: ['api', 'locationpool'],
                validate: {
                    params: {
                        userid: this.joi.string().required(),
                        locationid: this.joi.string().required()
                    }
                }
            }
        });

        // POST
        server.route({
            method: 'POST',
            path: '/user/{userid}/locations',
            config: {
                handler: (request, reply) => {
                    this.db.createLocation(request.params.userid, request.payload, (err, data) => {
                        if (err) {
                            return reply(this.boom.wrap(err, 400, err.details.message));
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
            path: '/user/{userid}/locations/{locationid}',
            config: {
                handler: (request, reply) => {
                    this.db.updateLocation(request.params.locationid, request.params.userid, request.payload, (err, data) => {
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

    errorInit(error) {
        if (error) {
            console.log('Error: Failed to load plugin (Locationpool):', error);
        }
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
            geotag: this.joi.string(),
            budget: this.joi.number(),
            pics: this.joi.array(), // TODO: could be better?
            category: this.joi.string(),
            type: this.joi.string.required().only('location')
        });

        this.locationSchemePUT = this.locationSchemePOST
            .concat(this.joi.object().keys({
                _id: this.joi.string().required(),
                _rev: this.joi.string().required()
            }));

    }


}