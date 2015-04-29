# backend-locationpool
For managing all locations of a user.

# Documents

### Beschreibung
Jeder _local_ hat ein pool an seinen favorisierten location, die er "cool" findet. Eine Location Besteht aus:
 - einem Ort (Name) (o.ä.?)
 - Bilder (+ Thumbnail)
 - Geotag  // Evtl. in der Desktop Version mit ner GoogleMap umsetzen?
 - Beschreibung 
 - URL zu Bild
 - und/oder ???

Der Locationpool eines Benutzers besteht aus einer _leichtgewichtige_ Liste aller Locations. //TODO: diskutieren.


### Routes
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
