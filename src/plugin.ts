declare var Promise:any;

import {initLogging, log, logError, logCorrupt} from './util/logging'

export interface IRegister {
    (server:any, options:any, next:any): void;
    attributes?: any;
}

export default
class Locationpool {
    private joi:any;
    private boom:any;
    private db:any;
    private data:any;
    private locationSchemePOST:any;
    private locationSchemaProduction:any;
    private locationSchemePUT:any;
    private regex:any;
    private imageValidation:any;
    private imageSchemaPost:any;
    private imageSize:any;
    private scheduler:any;


    constructor() {
        this.register.attributes = {
            pkg: require('./../../package.json')
        };
        this.joi = require('joi');
        this.boom = require('boom');
        this.scheduler = require('node-schedule');

        var imageUtil = require('locator-image-utility');
        this.imageSize = imageUtil.size;
        this.regex = imageUtil.regex;
        this.imageValidation = imageUtil.validation;

        this.initSchema();
    }

    register:IRegister = (server, options, next) => {
        server.bind(this);

        // set dependency to the database plugin
        server.dependency('ark-database', (server, next) => {
            this.db = server.plugins['ark-database'];
            next();
        });

        // set dependency to the database plugin
        server.dependency('ark-staticdata', (server, next) => {
            this.data = server.plugins['ark-staticdata'];
            next();
        });

        this._register(server, options);
        initLogging(server);
        next();
    };

    private _register(server, options) {

        this.registerScheduledJob();

        // payload for image
        var imagePayload = {
            output: 'stream',
            parse: true,
            allow: 'multipart/form-data',
            maxBytes: 1048576 * 6 // 6MB
        };


        //register all routes
        // GET
        server.route({
            method: 'GET',
            path: '/users/my/locations',
            config: {
                handler: (request, reply) => {
                    reply(this.db.getLocationsByUserId(request.auth.credentials._id));
                },
                description: 'Get the location pool of a user',
                notes: 'Return a list of all saved  location of a user.',
                tags: ['api', 'locationpool']
            }
        });

        // GET
        server.route({
            method: 'GET',
            path: '/users/my/preLocations',
            config: {
                handler: (request, reply) => {
                    reply(this.db.getPreLocationsByUserId(request.auth.credentials._id));
                },
                description: 'Get all preLocation pool of a user. Meaning all locations,' +
                'which are not ready yet to go public',
                notes: 'Return a list of all saved  location of a user.',
                tags: ['api', 'locationpool']
            }
        });

        server.route({
            method: 'GET',
            path: '/locations/city/{city}',
            config: {
                auth: false,
                handler: (request, reply) => {
                    var city = request.params.city;
                    var query = request.query;

                    if (!query) {
                        reply(this.db.getLocationsByCity(city));
                    } else {
                        reply(this.db.getPagedLocationsByCity(city, query))
                    }
                },
                description: 'Get all locations from a city. Currently only cities from Konstanz, Freiburg, Karlsruhe, Tuebuingen and Heidelberg',
                notes: 'Return a list of all saved  location of a city.',
                tags: ['api', 'locationpool'],
                validate: {
                    params: {
                        city: this.joi.string().required()
                    },
                    query: this.joi.object().keys({
                        page: this.joi.number().integer(),
                        elements: this.joi.number().integer().positive()
                    }).and('page', 'elements')
                }
            }
        });

        server.route({
            method: 'GET',
            path: '/users/my/locations/city/{city}',
            config: {
                handler: (request, reply) => {
                    var city = request.params.city;
                    reply(this.db.getLocationsByCityAndUser(city, request.auth.credentials._id));
                },
                description: 'Get all MY locations from a city. Currently only cities from Konstanz, Freiburg, Karlsruhe, Tuebuingen and Heidelberg',
                notes: 'Return a list of all saved  location of a user.',
                tags: ['api', 'locationpool'],
                validate: {
                    params: {
                        city: this.joi.string().required()
                    }
                }
            }
        });


        server.route({
            method: 'GET',
            path: '/users/my/locations/{locationid}',
            config: {
                auth: false,
                handler: (request, reply) => {
                    reply(this.db.getLocationById(request.params.locationid));
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
                    reply(this.db.getLocationById(request.params.locationid))
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
            path: '/users/{userid}/locations',
            config: {
                auth: false,
                handler: (request, reply) => {
                    reply(this.db.getPublicLocationsByUserId(request.params.userid))
                },
                description: 'Get locationpool of a user',
                notes: 'Returns the locationpool of a user.',
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
            path: '/trips/{tripid}/locations',
            config: {
                auth: false,
                handler: (request, reply) => {
                    reply(this.db.getLocationsByTripId(request.params.tripid))
                },
                description: 'Get all locations, which belong to a certain trip',
                notes: 'All locations in a trip',
                tags: ['api', 'locationpool'],
                validate: {
                    params: {
                        tripid: this.joi.string().required()
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
                    var documentId = request.params.locationid;
                    var size = request.query.size;

                    if (!size) {
                        // return biggest picture if no size is given
                        return reply(this.db.getPicture(documentId, this.imageSize.max.name));
                    } else {
                        return reply(this.db.getPicture(documentId, size));
                    }

                },
                description: 'Get a picture of a location',
                notes: 'sample call: /locations/1222123132/locationTitle-location.jpg. The url is found, when a ' +
                'location is requested with GET /locations/:locationID or GET /users/my/locations',
                tags: ['api', 'location'],
                validate: {
                    params: {
                        locationid: this.joi.string()
                            .required(),
                        name: this.joi.string()
                            .required(),
                        ext: this.joi.string()
                            .required().regex(this.regex.imageExtension)
                    },
                    query: this.joi.object().keys({
                        size: this.joi.string().valid([
                            this.imageSize.max.name,
                            this.imageSize.mid.name,
                            this.imageSize.small.name,
                            this.imageSize.mobile.name,
                            this.imageSize.mobileThumb.name
                        ])
                    }).unknown()
                }

            }
        });

        // POST
        server.route({
            method: 'POST',
            path: '/users/my/locations',
            config: {
                handler: (request, reply) => {

                    var mapURL = 'https://maps.googleapis.com/maps/api/staticmap?zoom=15&markers=' +
                        request.payload.geotag.lat + ',' + request.payload.geotag.long;

                    var newLocation = {
                        type: 'location',
                        userid: request.auth.credentials._id,
                        title: request.payload.title,
                        description: request.payload.description,
                        city: request.payload.city,
                        category: request.payload.category,
                        tags: request.payload.tags,
                        geotag: request.payload.geotag,
                        images: {
                            googlemap: mapURL
                        }
                    };

                    // reply promise
                    reply(this.db.createLocation(newLocation));
                },
                description: 'Create a single location for a user',
                tags: ['api', 'locationpool'],
                validate: {
                    payload: this.locationSchemePOST.required()
                        .description('Location JSON object')
                }
            }
        });

        // create a new location with form data
        server.route({
            method: 'POST',
            path: '/users/my/locations/picture',
            config: {
                payload: imagePayload,
                handler: (request, reply) => {
                    this.createLocationWithImage(request, reply, 'location')
                },
                description: 'Creates a new location with form data. Used when a picture is uploaded first',
                tags: ['api', 'location'],
                validate: {
                    payload: this.imageSchemaPost
                }
            }
        });

        // create a new location with form data
        server.route({
            method: 'POST',
            path: '/users/my/locations/picture/mobile',
            config: {
                payload: imagePayload,
                handler: (request, reply) => {
                    this.createLocationWithImage(request, reply, 'location-mobile')
                },
                description: 'Creates a new location with form data. Used when a picture is uploaded first',
                tags: ['api', 'location'],
                validate: {
                    payload: this.imageSchemaPost
                }
            }
        });

        // PUT
        server.route({
            method: 'PUT',
            path: '/users/my/locations/{locationid}',
            config: {
                handler: (request, reply) => {
                    // Potential Bug. For now we are certain that the frontend will provide enough data to
                    // convert this preLocation into a real one
                    request.payload.preLocation = false;

                    // add geotag image
                    if (request.payload.geotag) {
                        request.payload.images = {
                            googlemap: 'https://maps.googleapis.com/maps/api/staticmap?zoom=15&markers=' +
                            request.payload.geotag.lat + ',' + request.payload.geotag.long
                        };
                        var prom2 = this.db.updateTripsWithLocationImage(request.params.locationid, request.auth.credentials._id, request.payload.images);
                    }

                    var prom1 = this.db.updateLocation(request.params.locationid, request.auth.credentials._id, request.payload);

                    Promise.all([prom1, prom2 || true])
                        .then(value => {
                            reply(value[0])
                        }).catch(reply);
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

        // update the main picture of a location
        server.route({
            method: ['PUT', 'POST'],
            path: '/locations/{locationid}/picture',
            config: {
                payload: imagePayload,
                handler: (request, reply) => {
                    var locationid = request.params.locationid;
                    var userid = request.auth.credentials._id;
                    this.isItMyLocation(userid, locationid)
                        .then(() => {
                            // upload all images
                            return this.data.uploadImage(request, 'location')
                        }).then((value:any) => {
                            var url = value.imageLocation;
                            return reply(value).created(url);
                            return this.db.updateTripsWithLocationImage(locationid, userid, {picture: url});

                        }).catch(reply);
                },
                description: 'Update the main picture of a particular location',
                notes: 'The picture in the database will be updated.',
                tags: ['api', 'location'],
                validate: {
                    params: {
                        locationid: this.joi.string().required()
                    },
                    payload: this.imageSchemaPost
                }
            }
        });


        // update the main picture of a location
        server.route({
            method: ['PUT', 'POST'],
            path: '/locations/{locationid}/picture/mobile',
            config: {
                payload: imagePayload,
                handler: (request, reply) => {
                    var locationid = request.params.locationid;
                    var userid = request.auth.credentials._id;

                    this.isItMyLocation(userid, locationid)
                        .then(() => {
                            // upload all images
                            return this.data.uploadImage(request, 'location')
                        }).then((value:any) => {
                            // reply and update other trips
                            var url = value.imageLocation;
                            reply(value).created(url);
                            return this.db.updateTripsWithLocationImage(locationid, userid, {picture: url});

                        }).catch(reply);
                },
                description: 'Update the main picture of a particular location',
                notes: 'The picture in the database will be updated.',
                tags: ['api', 'location'],
                validate: {
                    params: {
                        locationid: this.joi.string().required()
                    },
                    payload: this.imageSchemaPost
                }
            }
        });

        // update/create the main picture of a location
        server.route({
            method: ['PUT', 'POST'],
            path: '/locations/{locationid}/togglePublic',
            config: {
                handler: (request, reply) => {
                    reply(this.db.togglePublicLocation(request.params.locationid, request.auth.credentials._id));
                },
                description: 'Change the status of a location into Public/Private',
                notes: 'If location was public it is transformed into private and vice verca',
                tags: ['api', 'location'],
                validate: {
                    params: {
                        locationid: this.joi.string().required()
                    }
                }
            }
        });

        server.route({
            method: 'DELETE',
            path: '/users/my/locations/{locationid}',
            config: {
                handler: (request, reply) => {
                    this.db.isLocationNotInUse(request.params.locationid).then(()=> {
                        // delete location
                        reply(this.db.deleteLocationById(request.params.locationid, request.auth.credentials._id));
                    }).catch(reply);
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

        server.route({
            method: 'DELETE',
            path: '/users/my/locations/{locationid}/force',
            config: {
                handler: (request, reply) => {
                    var prom1 = this.db.deleteLocationById(request.params.locationid, request.auth.credentials._id);
                    var prom2 = this.db.removeLocationFromTrips(request.params.locationid, request.auth.credentials._id);
                    reply(Promise.all([prom1, prom2]));
                },
                description: 'Delete a single location of a user and updates all trips, where this location was referenced',
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

    private createLocationWithImage(request, reply, type) {
        // create an empty "preLocation" before uploading a picture
        var userid = request.auth.credentials._id;
        var preLocation = {
            type: 'location',
            userid: userid,
            preLocation: true
        };

        this.db.createLocation(preLocation)
            .then(data => {

                // upload image
                request.params.locationid = data.id;
                return this.data.uploadImage(request, type)

            }).then((value:any) => {

                var url = value.imageLocation;

                // reply and update other trips
                reply(value).created(url);
                return this.db.updateTripsWithLocationImage(value.id, userid, {picture: url});

            }).catch(reply);
    }

    /**
     * Utility method for checking if the given userid belongs to the given locationid
     * @param userid
     * @param locationid
     * @returns {Promise|Promise<T>}
     */
    private isItMyLocation(userid:string, locationid:string):any {
        return new Promise((resolve, reject) => {

            this.db.getLocationById(locationid).then(data => {

                if (!data.userid || data.userid !== userid) {
                    return reject(this.boom.forbidden());
                }
                return resolve(data)

            }).catch(reject)
        });
    }

    /**
     * Create validation schema for location.
     */
    private initSchema():void {
        // basic schema
        var locationSchema = this.joi.object().keys({
            title: this.joi.string(),
            description: this.joi.string().allow(''),

            city: this.joi.object().keys({
                title: this.joi.string().required(),
                place_id: this.joi.string().required(),
                id: this.joi.string().required()
            }),

            geotag: this.joi.object().keys({
                long: this.joi.number().required(),
                lat: this.joi.number().required()
            }),
            tags: this.joi.array().items(this.joi.string().allow('').required()),
            delete: this.joi.boolean().default(false),
            public: this.joi.boolean().default(true)
        });

        var requiredSchema = locationSchema.requiredKeys('title', 'description', 'city', 'tags', 'geotag');

        this.locationSchemePOST = requiredSchema.required().description('JSON object for creating a location');
        this.locationSchemePUT = locationSchema.required().min(1).description('Update location');

        this.imageSchemaPost = this.imageValidation.basicImageSchema.keys({
            locationTitle: this.joi.string().required()
        });

        this.locationSchemaProduction = this.locationSchemePOST.keys({
            create_date: this.joi.date().required(),
            images: this.joi.object().keys({
                googlemap: this.joi.string().required(),
                picture: this.joi.string()
            }),
            delete: this.joi.boolean().only(false),
            public: this.joi.boolean(),
            userid: this.joi.string().required(),
        })

    }

    private registerScheduledJob():void {
        // every day at 01:00
        var job = this.scheduler.scheduleJob('0 1 * * *', () => {
            // check integrity of all locations
            this.db.getAllLocations().then(res => {
                logCorrupt('Started scanning for corrupt files');

                res.forEach(location => {

                    this.joi.validate(location, this.locationSchemaProduction.required().unknown(), (err, result) => {
                        if (result.preLocation) {
                            return;
                        }

                        if (err) {
                            logCorrupt('This location is corrupt: ' + location._id + ' Because of: ');
                            logCorrupt(err)
                        }
                    })

                })
            }).catch(err => logError(err));
        })
    }
}
