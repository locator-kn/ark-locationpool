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
        server.route({
            method: 'GET',
            path: '/user/{userid}/locations',
            config: {
                handler: (request, reply) => {
                    // TODO
                    reply('HUHU');
                },
                description: 'Get the location pool of a user',
                tags: ['api', 'locationpool']
            }
        });

        server.route({
            method: 'GET',
            path: '/user/{userid}/locations/{locationsid}',
            config: {
                handler: (request, reply) => {
                    // TODO
                    reply('HUHU');
                },
                description: 'Get a single location of a user',
                tags: ['api', 'locationpool']
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