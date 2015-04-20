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
            path: '/user/{userID}/locations',
            config: {
                handler: (request, reply) => {
                    // config the handler
                },
                description: '', // TODO
                tags: ['', ''] //TODO
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