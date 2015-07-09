var server;

export function initLogging(hapiServer:any) {
    server = hapiServer;
}


export function log(logging:string) {
    if (!server) {
        console.error('Server not initialized for logging');
        return;
    }

    server.log(['locationpool'], logging);
}

export function logError(logging:string) {
    if (!server) {
        console.error('Server not initialized for logging');
        return;
    }

    server.log(['locationpool', 'Error'], logging);
}


export function logCorrupt(logging:string) {
    if (!server) {
        console.error('Server not initialized for logging');
        return;
    }

    server.log(['trip', 'corrupt'], logging);
}
