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
####GET/DELETE

|Ressource   | Description  |  on Success | on Failure |
|---|---|---|---|
|/user/:userID/locations/  | returns/eletes a locationpool (list) of saved location of the user   | json object | statusCode: 404 |
|/user/*:userID*/locations/:locationsID (user id nötig??) | returns/delets a particular saved location of the user | json object | statusCode: 404 |

####POST

|Ressource   | Description  | on Failure |
|---|---|---|---|
|/user/:userID/locations/  | adds a location into the location pool of the user   |  statusCode: 404 |

Note: Bulk add will be done if payload is array.

####PUT


|Ressource   | Description  | on Failure |
|---|---|---|---|
|/user/:userID/locations/:locationsID  | updates a location of the location pool of the user   |  statusCode: 404 |



### Dummy json results

```
{
  "_id:" "1849ef313fbc39f078084f9168000e16",
  "_rev": "4-c726329a4e810962443ce5a7a176b00c",
  "title": "Strandbar",
  "description": "Fett man! Sand und so! Geile Musiiik!!",
  "city": "constance",
  "geotag": "",
  "budget": 100,
  "pics": [],
  "category": "studentenshit",
  "type": "location"
}
```
