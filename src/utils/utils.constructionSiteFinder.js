/**
* This namespace has functions with logic for finding optimal construction sites.
* @namespace
*/
var SiteFinder = {};

// @cpu AVERAGE * 3 + LOW * (extentions + 1)
var _evalSiteForExtention = function(sitePos, spawn, extentions, pathsToAvoid) {
	var cost = 0;

	// Don't build on invalid land
	var objects = sitePos.look();
	for (var i in objects) {
		var object = objects[i];
		if (object.type == "structure") return Number.MAX_SAFE_INTEGER;
		if (object.type == "terrain" && object.terrain == "wall") return Number.MAX_SAFE_INTEGER;
	}

	// Don't build right next to anything, but try to be as close to everything as possible.
	var nonWalkableStructures = spawn.room.find(FIND_STRUCTURES, {filter: (s) => { return !s.isWalkable(); }});
	for (var i in nonWalkableStructures) {
	    if (sitePos.getRangeTo(nonWalkableStructures[i].pos) <= 1) return Number.MAX_SAFE_INTEGER;
	} 
	
	var distToSpawn = sitePos.getRangeTo(spawn.pos);
	cost += distToSpawn;

	for (var i in extentions) {
		var distToEx = sitePos.getRangeTo(extentions[i].pos);
		cost += distToEx;
	}

	// Also, don't build on reserved paths.
	for (var i in pathsToAvoid) {
		var path = pathsToAvoid[i];
		if (Utils.pathContainsPos(path, sitePos)) return Number.MAX_SAFE_INTEGER;
	}

	return cost;
}

/**
* Finds a site for an extension.
* @param spawn {StructureSpawn} The spawn to find the extension for.
* @returns {RoomPosition} The optimal position for the extension.
*/
SiteFinder.findSiteForExtension = function(room) {
	if (!room) return null;

	var bestSite = null;
	var bestCost = Number.MAX_SAFE_INTEGER;

	var extentions = room.find(FIND_MY_STRUCTURES, {filter: (s) => {return s.structureType == STRUCTURE_EXTENSION;}});
	var pathsToAvoid = [];
	var sources = room.find(FIND_SOURCES);
	var spawn = room.find(FIND_MY_STRUCTURES, {filter: (s) => {return s.structureType == STRUCTURE_SPAWN}})[0];
	if (!spawn) throw new Error("SiteFinder.findSiteForExtension: Looking for extension in room without ally spawn.");
	for (var i in sources) {
		pathsToAvoid.push(spawn.pos.findPathTo(sources[i], {ignoreCreeps:true}));
	}
	pathsToAvoid.push(spawn.pos.findPathTo(room.controller, {ignoreCreeps:true}));

	Utils.processAllSquaresInRoom(spawn.room, (squarePos) => {
		var cost = _evalSiteForExtention(squarePos, spawn, extentions, pathsToAvoid);
		if (cost < bestCost) {
			bestCost = cost;
			bestSite = squarePos;
		}
	})

	return bestSite;
}

var _evalSiteForTower = function(site, otherTowers, roomSpawns) {
    // Make sure we are at least 1 tile from every structure, and not on a structure, and not on a wall.
    var badSite = false;
    Utils.processNearby(site, (s) => {
    	var structures = s.lookFor(LOOK_STRUCTURES);
    	if (structures.length && (structures[0].structureType !== STRUCTURE_ROAD || (s.x == site.x && s.y == site.y))) {
            badSite = true;
            return true;
        }
    });
    if (badSite) return Number.MAX_SAFE_INTEGER;
    
    if (Game.map.getTerrainAt(site) == "wall") return Number.MAX_SAFE_INTEGER;
    
    var cost = structureConstants.towerSiteCostConstants.COST_FOR_OFF_CENTER * site.getRangeTo(24, 24);
    for (var i in otherTowers) {
        cost += structureConstants.towerSiteCostConstants.COST_FOR_OFF_OTHER_TOWER * site.getRangeTo(otherTowers[i]);
    }
    for (var i in roomSpawns) {
        cost += structureConstants.towerSiteCostConstants.COST_FOR_OFF_SPAWN * site.getRangeTo(roomSpawns[i]);
    }
    
    return cost;
}

/**
* Finds the optimal site for a tower.
* @param room {Room} The room to place the tower.
* @returns {RoomPosition} The optimal position for the tower, or null.
*/
SiteFinder.findSiteForTower = function(room) {
    var myStructures = room.find(FIND_MY_STRUCTURES);
    var otherTowers = _.filter(myStructures, (s) => {return s.structureType === STRUCTURE_TOWER;});
    var roomSpawns = _.filter(myStructures, (s) => {return s.structureType === STRUCTURE_SPAWN;});
    
    var bestCost = Number.MAX_SAFE_INTEGER;
    var bestSite = null;
    Utils.processAllSquaresInRoom(room, (site) => {
    	var siteCost = _evalSiteForTower(site, otherTowers, roomSpawns);
        if (siteCost < bestCost) {
            bestCost = siteCost;
            bestSite = site;
        }
    });
    
    return bestSite;
}

/**
* Wrapper for the SiteFinder.findSiteFor functions. Takes a room and a structure type and
* finds the optimal site for that structure in that room.
* @param room {Room} The room
* @param structureType One of the STRUCTURE_* constants. The type to find a site for.
* @returns {RoomPosition} The optimal position.
*/
SiteFinder.findSiteForStructure = function(room, structureType) {
	if (structureType == STRUCTURE_EXTENSION) return SiteFinder.findSiteForExtension(room);
	if (structureType == STRUCTURE_TOWER) return SiteFinder.findSiteForTower(room);
	throw new Error("SiteFinder.findSiteForStruture: Unsupported structure type " + structureType);
}

var _continueRoadToInSameRoom = function(startPos, endPos) {
	// Get the path.
	var path = startPos.findPathTo(endPos, {ignoreCreeps:true});

    for (var pathIndex in path) {
	    var roadNeeded = true;
	    var pos = new RoomPosition(path[pathIndex].x, path[pathIndex].y, startPos.roomName);
	    var objects = pos.look();

	    // If there is a blocking object, we don't need a road here.
	    for (var objIndex in objects) {
	    	var obj = objects[objIndex];
	 	    if (obj.type == LOOK_STRUCTURES || obj.type == LOOK_TERRAIN && obj.terrain == "wall") {
		   		roadNeeded = false;
		    	break;
		    }
		    if (obj.type == LOOK_CONSTRUCTION_SITES && obj.constructionSite.structureType == STRUCTURE_ROAD) return pos;
		}

	    if (roadNeeded) {
		    if (Game.rooms[startPos.roomName].createConstructionSite(pos, STRUCTURE_ROAD) == ERR_INVALID_TARGET) continue;
		    return pos;
	    }
	}

	return null;
}

/**
* Checks to see if there is a road between two points. If there is a road piece missing, this function will
* create a new road construction site and return the position of the site.
* @param startPos {RoomPosition} The position to start the road.
* @param endPos {RoomPosition} The position to end the road.
* @returns {RoomPosition} The position of the next road segment to build, or null if the road is complete.
*/
SiteFinder.continueRoadTo = function(startPos, endPos) {
    var roomRoute = Game.map.findRoute(startPos.roomName, endPos.roomName);
    for (var routeIndex = 0; routeIndex <= roomRoute.length; routeIndex++) {
        var startRoom = Game.rooms[startPos.roomName];
        if (!startRoom) return ERR_NOT_FOUND;
        var dest = endPos;
        if (routeIndex < roomRoute.length) {
            dest = startPos.findClosestByPath(startRoom.find(roomRoute[routeIndex].exit), {ignoreCreeps:true});
        }

        var possibleRoad = _continueRoadToInSameRoom(startPos, dest);
        if (possibleRoad) return possibleRoad;
	    
	    if (routeIndex < roomRoute.length) {
	        var lastPathSquare = new RoomPosition(path[path.length-1].x, path[path.length-1].y, startPos.roomName);
	        startPos = Utils.getAdjacentSquareInNextRoom(lastPathSquare, roomRoute[routeIndex].room, roomRoute[routeIndex].exit);
	    }
    }

	return null;
}