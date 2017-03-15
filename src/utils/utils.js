/**
* A callback function passed into a filtering operation.
* @callback filterFunction
* @param obj {RoomObject} The object to either filter out or include.
* @returns {boolean} True if we want to include the object.
*/

/**
* Provides the costs of the creep body parts.
* Keys are the body part constants
* @constant {Object<BodyType, number>}
*/
var BODY_PART_COSTS = {};
BODY_PART_COSTS[MOVE] = 50;
BODY_PART_COSTS[WORK] = 100;
BODY_PART_COSTS[CARRY] = 50;
BODY_PART_COSTS[ATTACK] = 80;
BODY_PART_COSTS[RANGED_ATTACK] = 150;
BODY_PART_COSTS[HEAL] = 250;
BODY_PART_COSTS[CLAIM] = 600;
BODY_PART_COSTS[TOUGH] = 10;

/**
* This namespace provides utility functions.
*
* @namespace
*/
var Utils = {};

/**
* Gets the cost for a creep body
* @param body {Array<BodyType>} The body to cost
* @returns {number} The cost of the body
*/
Utils.bodyCost = function(body) {
    var cost = 0;
    for (var i in body) {
        var part = body[i];
        cost += BODY_PART_COSTS[part];
    }
    return cost;
}

/** This callback is called by Utils.processNearby
* @callback Utils.pNearbyCb
* @param pos {RoomPosition}
* @returns {boolean|void} Returns true if we should stop processing.
*/

/**
* Calls a callback function on all squares surrounding a provided
* square.
* @param pos {RoomPosition} The position to process around.
* @param callback {pNearbyCp} The function to call on nearby pos.
* @param [includePos=true] {boolean} Whether pos should be passed to the callback as well.
* @param [range=1] {number} The range withing which to process. 1 equates to the eight squares surrounding
* the pos.
*/ 
Utils.processNearby = function(pos, callback, includePos, range) {
    if (typeof includePos === "undefined") includePos = true;
    if (typeof range === "undefined") range = 1;

    for (var x = pos.x - range; x <= pos.x + range; x++) {
        if (x < 0 || x >= 50) continue;
        for (var y = pos.y - range; y <= pos.y + range; y++) {
            if (y < 0 || y >= 50) continue;
            if (x == pos.x && y == pos.y && !includePos) continue;
            if (callback(new RoomPosition(x, y, pos.roomName))) return;
        }
    }
}

/**
* Similar to processNearby, but passes every position in a room to a callback.
* @param room {Room} The room
* @param callback {pNearbyCp} The function to call.
*/
Utils.processAllSquaresInRoom = function(room, callback) {
    for (var x = 0; x < 50; x += 1) {
        for (var y = 0; y < 50; y += 1) {
            if (callback(room.getPositionAt(x, y))) return;
        }
    }
}

/**
* Calculates the allowed intent on an object.
* Currently, that means how many open spaces are
* around it.
* @param target {RoomObject} The target to calculate allowed intent for.
* @cpu AVERAGE * 9
*/
Utils.recalcAllowedIntent = function(target) {
    var allowed = 0;
    Utils.processNearby(target.pos, (nearbyPos) => {
        var blocker = false;
        var objects = nearbyPos.look();
        for (var i in objects) {
            var object = objects[i];
            if (object.type === "structure" && object.structure.structureType !== STRUCTURE_ROAD && object.structure.structureType !== STRUCTURE_CONTAINER) {
                blocker = true;
            }
            if (object.type === "terrain" && object.terrain === "wall") {
                blocker = true;
            }
        }
        if (!blocker) {
            allowed += 1;
        }
    });

    Memphis.setAllowedIntent(target, allowed);
}

/**
* Retrieves an array of Creep objects intent on the target.
* @param target {RoomObject} The target.
* @returns {Array<Creep>} Intent Creeps.
*/
Utils.creepsIntentOn = function(target) {
    var creeps = [];
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.memory.intention === target.id) {
            creeps.push(creep);
        }
    }
    
    return creeps;
}

/**
* Filters targets by calling the intentAllowed function on each.
* By default it uses the number of walkable spaces around the target.
* @param targets {Array<RoomObject>} The targets to filter.
* @returns {Array<RoomObject>} The targets that allow intent.
*/
Utils.filterByIntent = function(targets) {
    return _.filter(targets, function(target) {
        if (typeof target.intentAllowed === "function") return target.intentAllowed();
        var creepsIntent = Utils.creepsIntentOn(target);
        return Memphis.getAllowedIntent(target) > creepsIntent.length;
    });
}

/**
* Takes an object and returns an array of key-value pairs sorted by
* key.
* @param object {Object} The object to sort.
* @returns {Array<Object>} Array of key-value pairs sorted by key.
*/
Utils.sortObjectByProperties = function(object) {
    var sortable = [];
    for (var prop in object) {
        sortable.push([prop, object[prop]]);
    }
    sortable.sort(function(a, b) {return a[0] - b[0]});
    return sortable;
}

/**
* Returns true if the provided path contains the pos.
* @param path Path provided by any of the findPath functions.
* @param pos {RoomPosition} The position to look for.
* @returns {boolean} True if the path contains pos.
* @cpu AVERAGE
*/
Utils.pathContainsPos = function(path, pos) {
    for (var i in path) {
        if (path[i].x == pos.x && path[i].y == pos.y) return true;
    }
    return false;
}

/**
* Global onTick vs Class specific onTick. Things that need to happen every tick, once per tick.
* Called by {@link loop}.
*/
Utils.onTick = function() {
    Memphis.repairUpdate();
    Memphis.cleanupAllMemory();
}

/**
* Gets the adjacent square in the next room given a position, the next room name, and
* the exit direction.
* @param pos {RoomPosition} The exit position in the initial room.
* @param nextRoomName {string} The name of the next room.
* @param exitType One of the FIND_* constants describing the exit direction.
* @returns {RoomPosition} The position in the other room. ERR_NOT_FOUND if exitType is bad.
*/
Utils.getAdjacentSquareInNextRoom = function(pos, nextRoomName, exitType) {
    switch(exitType) {
        case FIND_EXIT_TOP:
            return new RoomPosition(pos.x, 49, nextRoomName);
        case FIND_EXIT_BOTTOM:
            return new RoomPosition(pos.x, 0, nextRoomName);
        case FIND_EXIT_LEFT:
            return new RoomPosition(49, pos.y, nextRoomName);
        case FIND_EXIT_RIGHT:
            return new RoomPosition(0, pos.y, nextRoomName);
        default:
            return ERR_NOT_FOUND;
    }
}

/**
* Finds all the structures in a room capable of receiving a resource.
* @param room {Room} The room to search.
* @param [resourceType=RESOURCE_ENERGY] One of the RESOURCE_* constants. Currently only RESOURCE_ENERGY is supported.
* @param [filter] {filterFunction} A filter function. If defined, filters the results.
* @returns {Array<Structure>} An array of structures that can accept a deposit.
*/
Utils.getAllDepositCapableStructures = function(room, resourceType, filter) {
    if (typeof resourceType == "undefined") resourceType = RESOURCE_ENERGY;

    var depositableStructures = [];

    if (resourceType == RESOURCE_ENERGY) {
        depositableStructures = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return ((structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_SPAWN ||
                        structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity) ||
                        ((structure.structureType == STRUCTURE_CONTAINER ||
                        structure.structureType == STRUCTURE_STORAGE) && _.sum(structure.store) < structure.storeCapacity);
            }
        });
    } else if (resourceType !== RESOURCE_POWER) {
        // This means we are working with a molecule compound.
        return room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                // TODO: May need to get labs to work with this.
                return (structure.structureType == STRUCTURE_CONTAINER ||
                        structure.structureType == STRUCTURE_STORAGE) && _.sum(structure.store) < structure.storeCapacity;
            }
        })
    } else {
        // We are working with Power.
        throw new Error("Power depositing not yet supported.");
    }

    if (typeof filter !== "undefined") depositableStructures = _.filter(depositableStructures, filter);
    return depositableStructures;
}