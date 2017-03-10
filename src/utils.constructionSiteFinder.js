/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('utils.constructionSiteFinder');
 * mod.thing == 'a thing'; // true
 */
 
var utils = require("utilities");

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
	var nonWalkableStructures = spawn.room.find(FIND_STRUCTURES, {filter: (s) => { return s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_CONTAINER; }});
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
		if (utils.pathContainsPos(path, sitePos)) return Number.MAX_SAFE_INTEGER;
	}

	return cost;
}

var _findSiteForExtension = function(spawn) {
	if (!spawn) return null;

	var bestSite = null;
	var bestCost = Number.MAX_SAFE_INTEGER;

	var extentions = spawn.room.find(FIND_MY_STRUCTURES, {filter: (s) => {return s.structureType == STRUCTURE_EXTENSION;}});
	var pathsToAvoid = [];
	var sources = spawn.room.find(FIND_SOURCES);
	for (var i in sources) {
		pathsToAvoid.push(spawn.pos.findPathTo(sources[i]));
	}
	pathsToAvoid.push(spawn.pos.findPathTo(spawn.room.controller));

	for (var x = 0; x < 50; x += 1) {
		for (var y = 0; y < 50; y += 1) {
			var cost = _evalSiteForExtention(spawn.room.getPositionAt(x, y), spawn, extentions, pathsToAvoid);
			if (cost < bestCost) {
				bestCost = cost;
				bestSite = spawn.room.getPositionAt(x, y);
			}
		}
	}

	return bestSite;
}

var _continueRoadTo = function(startPos, endPos) {
    var roomRoute = Game.map.findRoute(startPos.roomName, endPos.roomName);
    for (var routeIndex = 0; routeIndex <= roomRoute.length; routeIndex++) {
        var startRoom = Game.rooms[startPos.roomName];
        if (!startRoom) return ERR_NOT_FOUND;
        var dest = endPos;
        if (routeIndex < roomRoute.length) {
            dest = startPos.findClosestByPath(startRoom.find(roomRoute[routeIndex].exit), {ignoreCreeps:true});
        }
        var path = startPos.findPathTo(dest, {ignoreCreeps:true});
        for (var pathIndex in path) {
		    var roadNeeded = true;
		    var pos = new RoomPosition(path[pathIndex].x, path[pathIndex].y, startPos.roomName);
		    var objects = pos.look();
		    for (var objIndex in objects) {
		    	var obj = objects[objIndex];
		  	    if (obj.type == LOOK_STRUCTURES || obj.type == LOOK_TERRAIN && obj.terrain == "wall") {
		    		roadNeeded = false;
			    	break;
			    }
			    if (obj.type == LOOK_CONSTRUCTION_SITES && obj.constructionSite.structureType == STRUCTURE_ROAD) return pos;
		    }

		    if (roadNeeded) {
			    if (startRoom.createConstructionSite(pos, STRUCTURE_ROAD) == ERR_INVALID_TARGET) continue;
			    return pos;
		    }
	    }
	    
	    if (routeIndex < roomRoute.length) {
	        var lastPathSquare = new RoomPosition(path[path.length-1].x, path[path.length-1].y, startPos.roomName);
	        switch(roomRoute[routeIndex].exit) {
	            case FIND_EXIT_TOP:
	                startPos = new RoomPosition(lastPathSquare.x, 49, roomRoute[routeIndex].room);
	                break;
	            case FIND_EXIT_BOTTOM:
	                startPos = new RoomPosition(lastPathSquare.x, 0, roomRoute[routeIndex].room);
	                break;
	            case FIND_EXIT_LEFT:
	                startPos = new RoomPosition(49, lastPathSquare.y, roomRoute[routeIndex].room);
	                break;
	            case FIND_EXIT_RIGHT:
	                startPos = new RoomPosition(0, lastPathSquare.y, roomRoute[routeIndex].room);
	                break;
	            default:
	                return ERR_NOT_FOUND;
	        }
	    }
    }

	return null;
}

var _evalSiteForTower = function(site, otherTowers, roomSpawns) {
    const COST_FOR_OFF_CENTER = 1;
    const COST_FOR_OFF_SPAWN = 5;
    const COST_FOR_OFF_OTHER_TOWER = -4;
    
    // Make sure we are at least 1 tile from every structure, and not on a structure, and not on a wall.
    for (var x = site.x - 1; x <= site.x + 1; x++) {
        if (x < 0 || x >= 50) continue;
        for (var y = site.y - 1; y <= site.y + 1; y++) {
            if (y < 0 || y >= 50) continue;
            var s = new RoomPosition(x, y, site.roomName).lookFor(LOOK_STRUCTURES);
            if (s.length && (s[0].structureType !== STRUCTURE_ROAD || (x == site.x && y == site.y))) {
                return Number.MAX_SAFE_INTEGER;
            }
        }
    }
    
    if (Game.map.getTerrainAt(site) == "wall") return Number.MAX_SAFE_INTEGER;
    
    var cost = COST_FOR_OFF_CENTER * site.getRangeTo(24, 24);
    for (var i in otherTowers) {
        cost += COST_FOR_OFF_OTHER_TOWER * site.getRangeTo(otherTowers[i]);
    }
    for (var i in roomSpawns) {
        cost += COST_FOR_OFF_SPAWN * site.getRangeTo(roomSpawns[i]);
    }
    
    return cost;
}

var _findSiteForTower = function(room) {
    var myStructures = room.find(FIND_MY_STRUCTURES);
    var otherTowers = _.filter(myStructures, (s) => {return s.structureType === STRUCTURE_TOWER;});
    var roomSpawns = _.filter(myStructures, (s) => {return s.structureType === STRUCTURE_SPAWN;});
    
    var bestCost = Number.MAX_SAFE_INTEGER;
    var bestSite = null;
    for (var x = 0; x < 50; x++) {
        for (var y = 0; y < 50; y++) {
            var siteCost = _evalSiteForTower(room.getPositionAt(x, y), otherTowers, roomSpawns);
            if (siteCost < bestCost) {
                bestCost = siteCost;
                bestSite = room.getPositionAt(x, y);
            }
        }
    }
    
    return bestSite;
}

module.exports = {
    findSiteForExtension: _findSiteForExtension,
    continueRoadTo: _continueRoadTo,
    findSiteForTower: _findSiteForTower,
};