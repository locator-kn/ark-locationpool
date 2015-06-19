declare var Promise:any;

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
    private imgProcessor:any;
    private imageValidation:any;
    private imageSchemaPost:any;


    constructor() {
        this.register.attributes = {
            pkg: require('./../../package.json')
        };
        this.joi = require('joi');
        this.boom = require('boom');
        var imageUtil = require('locator-image-utility');
        this.regex = imageUtil.regex;
        this.imageValidation = imageUtil.validation;
        this.imgProcessor = imageUtil.image;

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

        // payload for image
        var imagePayload = {
            output: 'stream',
            parse: true,
            allow: 'multipart/form-data',
            // TODO: evaluate real value
            maxBytes: 1048576 * 6 // 6MB
        };

        var swaggerUpload = {
            'hapi-swagger': {
                payloadType: 'form'
            }
        };

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
                    reply(this.db.getLocationsByUserId(request.params.userid))
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

                    var mapURL = 'https://maps.googleapis.com/maps/api/staticmap?zoom=15&markers=' +
                        request.payload.geotag.long + ',' + request.payload.geotag.lat;

                    var newLocation = {
                        type: 'location',
                        userid: request.auth.credentials._id,
                        title: request.payload.title,
                        description: request.payload.description,
                        city: request.payload.city,
                        category: request.payload.category,
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
                handler: this.createLocationWithImage,
                description: 'Creates a new location with form data. Used when a picture is uploaded first',
                tags: ['api', 'location'],
                validate: {
                    payload: this.imageSchemaPost
                },
                plugins: swaggerUpload
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
                            request.payload.geotag.long + ',' + request.payload.geotag.lat
                        }
                    }

                    reply(this.db.updateLocation(request.params.locationid, request.auth.credentials._id, request.payload));
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

        // update/create the main picture of a location
        server.route({
            method: ['PUT', 'POST'],
            path: '/locations/{locationid}/picture',
            config: {
                payload: imagePayload,
                handler: this.mainPicture,
                description: 'Update/Change the main picture of a particular location',
                notes: 'The picture in the database will be updated.',
                tags: ['api', 'location'],
                validate: {
                    params: {
                        locationid: this.joi.string().required()
                    },
                    payload: this.imageSchemaPost
                },
                plugins: swaggerUpload
            }
        });

        // DELETE
        // should this route be provided? delete all locations??
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
                    reply(this.db.deleteLocationById(request.params.locationid, request.auth.credentials._id));
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
     * Method for saving the main picture of a location
     * @param request
     * @param reply
     */
    private mainPicture(request:any, reply:any):void {
        this.isItMyLocation(request.auth.credentials._id, request.params.locationid)
            .catch(err => reply(err))
            .then(() => {
                var name = request.payload.locationTitle + '-location';
                var stripped = this.imgProcessor.stripHapiRequestObject(request);
                stripped.options.id = request.params.locationid;

                this.savePicture(stripped.options, stripped.cropping, name, reply)
            });
    }

    private createLocationWithImage(request, reply) {
        // create an empty "preLocation" before uploading a picture
        var userid = request.auth.credentials._id;
        var preLocation = {
            type: 'location',
            userid: userid,
            preLocation: true
        };
        this.db.createLocation(preLocation).then(data => {

            // get user id from authentication credentials
            request.payload.userid = userid;

            var stripped = this.imgProcessor.stripHapiRequestObject(request);
            stripped.options.id = data.id;
            name = request.payload.locationTitle + '-location';

            // save picture to the just created document
            this.savePicture(stripped.options, stripped.cropping, name, reply)

        }).catch(err => reply(err));
    }

    /**
     * Save picture.
     *
     * @param info
     * @param cropping
     * @param name
     * @param reply
     */
    private savePicture(info:any, cropping:any, name:string, reply:any):void {

        // create object for processing images
        var imageProcessor = this.imgProcessor.processor(info);
        if (imageProcessor.error) {
            console.log(imageProcessor);
            return reply(this.boom.badRequest(imageProcessor.error))
        }

        // get info needed for output or database
        var metaData = imageProcessor.createFileInformation(name);

        // create a read stream and crop it
        var readStream = imageProcessor.createCroppedStream(cropping, {x: 1024, y: 600});  // TODO: size needs to be discussed
        var thumbnailStream = imageProcessor.createCroppedStream(cropping, {x: 256, y: 150});

        this.db.savePicture(info.id, metaData.attachmentData, readStream)
            .then(() => {
                metaData.attachmentData.name = metaData.thumbnailName;
                return this.db.savePicture(info.id, metaData.attachmentData, thumbnailStream);
            }).then(() => {
                return this.db.updateDocumentWithoutCheck(info.id, {images: metaData.imageLocation});
            }).then((value) => {
                this.replySuccess(reply, metaData.imageLocation, value)
            }).catch((err) => {
                return reply(err);
            });

    }

    /**
     * reply a success message for uploading a picture.
     *
     * @param reply
     * @param imageLocation
     */
    private replySuccess = (reply, imageLocation, dbresponse) => {
        reply({
            message: 'ok',
            imageLocation: imageLocation,
            id: dbresponse.id,
            rev: dbresponse.rev
        });
    };


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

            }).catch(err => {

                return reject(err);
            })
        });
    }

    /**
     * Create validation schema for location.
     */
    private initSchema():void {
        // basic schema
        var locationSchema = this.joi.object().keys({
            title: this.joi.string(),
            description: this.joi.string(),

            city: this.joi.object().keys({
                title: this.joi.string().required(),
                place_id: this.joi.string().required(),
                id: this.joi.string().required()
            }),

            geotag: this.joi.object().keys({
                lat: this.joi.number().required(),
                long: this.joi.number().required()
            }),
            budget: this.joi.string(),
            category: this.joi.string(),
            delete: this.joi.boolean().default(false)
        });

        var requiredSchema = locationSchema.requiredKeys('title', 'description', 'city', 'category', 'geotag');

        this.locationSchemePOST = requiredSchema.required().description('JSON object for creating a location');
        this.locationSchemePUT = locationSchema.required().min(1).description('Update location');

        this.imageSchemaPost = this.imageValidation.basicImageSchema.keys({
            locationTitle: this.joi.string().required()
        });

    }
}
