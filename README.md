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

|Ressource   | Description  |  on Success | on Failure |
|---|---|---|---|
|/users/:userID/locations/  | returns a locationpool (list) of saved location of the user   | json object | statusCode: 404 |
|/users/:userID/locations/:locationsID | returns a particular saved location of the user | json object | statusCode: 404 |

####DELETE
|Ressource   | Description  |  on Success | on Failure |
|---|---|---|---|
|/users/:userID/locations/ | deletes a locationpool (list) of saved location of the user   | json object | statusCode: 404 |
|/users/:userID/locations/:locationsID | deletes a particular saved location of the user | json object | statusCode: 404 |

####POST

|Ressource   | Description  | on Failure |
|---|---|---|---|
|/users/:userID/locations/  | adds a location into the location pool of the user   |  statusCode: 404 |

Note: Bulk add will be done if payload is array.

####PUT


|Ressource   | Description  | on Failure |
|---|---|---|---|
|/users/:userID/locations/:locationsID  | updates a location of the location pool of the user   |  statusCode: 404 |



### Dummy json for GET:

```
{
   "_id": "9ab15b624eec31eb56dffa3ed10006f7",
   "_rev": "1-eba4d566488a8efb82edd9dcb3d3be1c",
   "title": "Strandbar",
   "description": "Fett maan! Sand und Bier! Geile Musiiik!!",
   "city": "constance",
   "budget": 100,
   "pics": [
   ],
   "category": "studentenshit",
   "type": "location",
   "geotag": {
       "long": "47.668475",
       "lat": "9.170435"
   },
   "userId": "9ab15b624eec31eb56dffa3ed10006f5"
}
```

### Dummy json for POST:

param: 
```
"userId": "492387434908fs5747e35"
```

```
{
   "title": "Strandbar",
   "description": "Fett maan! Sand und Bier! Geile Musiiik!!",
   "city": "constance",
   "budget": 100,
   "pics": [
   ],
   "category": "studentenshit",
   "type": "location",
   "geotag": {
       "long": "47.668475",
       "lat": "9.170435"
   }
}
```
