# ark-locationpool
A hapi-plugin for [ark](https://github.com/locator-kn/ark) our application server of [locator-app.com](http://www.locator-app.com/). Used for handling the location(s) of a user.

## Usage
```npm install ark-locationpool```  to install the plugin (use the option ```-S``` to include it in your project)

```js
// Server 
var Locationpool = require('ark-locationpool'); // import it to your code
var loc = new Locationpool(); // create new instance

server.register(loc, function(err) { // register plugin to hapi server

 if (err) {
  return console.error(err);
 } else {
  server.start();  // start server
 }
 
});

```

Server has now additional route endpoints for handling location related operations.

For example:
####GET

|Ressource   | Description  |  on Success | 
|---|---|---|
|/users/:userID/locations/  | returns a locationpool (list) of saved location of the user   | json object | 
|/users/:userID/locations/:locationsID | returns a particular saved location of the user | json object |

####DELETE
|Ressource   | Description  |  on Success |
|---|---|---|
|/users/:userID/locations/:locationsID | deletes a particular saved location of the user | json object |

####POST

|Ressource   | Description  |
|---|---|---|---|
|/users/:userID/locations/  | adds a location into the location pool of the user   |

####PUT

|Ressource   | Description  |
|---|---|---|
|/users/:userID/locations/:locationsID  | updates a location of the location pool of the user   |

For a list of all routes checkout the main server [ark](https://github.com/locator-kn/ark), start it and open [swagger] (http://localhost:3001/documentation?tags=locationpool)
