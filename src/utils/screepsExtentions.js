// Room Object extensions ----------------------------------------
/**
* Game RoomObject class
* @class RoomObject
*/

/**
* Determines if a new creep may place intent on this object. TODO:
* currently it is impossible to tell what the creep intends to do
* to the object. This may be necessary info to determine if intent is
* allowed. Eg. A container may be targetted by creeps attempting to deposit
* or withdraw, and those intentions are complete opposites.
* @function RoomObject#intentAllowed
* @abstract
* @returns {boolean} True if a new creep may place intent.
*/
// ---------------------------------------------------------------
 
// Spawn extentions ---------------------------------------------
/**
* Game StructureSpawn class
* @class StructureSpawn
*/

/**
* Returns the energy capcity of the spawn including any extensions in the room.
* @returns {number} Energy capcity including extensions.
*/
StructureSpawn.prototype.energyCapacityIncludingExtentions = function() {
    var extentions = this.room.find(FIND_MY_STRUCTURES, {filter: function(structure) {
        return structure.structureType === STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN;
    }});
    var eCap = 0;
    for (var i in extentions) {
        var extention = extentions[i];
        eCap += extention.energyCapacity;
    }
    return eCap;
}
 
/**
* Returns the available energy in the spawn, including extensions.
* @returns {number} Available energy.
*/
StructureSpawn.prototype.energyIncludingExtentions = function() {
    var extentions = this.room.find(FIND_MY_STRUCTURES, {filter: function(structure) {
        return structure.structureType === STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN;
    }});
    var e = 0;
    for (var i in extentions) {
        var extention = extentions[i];
        e += extention.energy;
    }
    return e;
}
// --------------------------------------------------------------
 
// Room extentions ----------------------------------------------
/**
* Game Room class
* @class Room
*/

// Tells creeps to sound off their roles.
Room.prototype.soundOffRoles = function() {
    var myCreeps = this.find(FIND_MY_CREEPS);
    for (var name in myCreeps) {
        var c = myCreeps[name];
        c.soundOff("role");
    }
}


// I thought I could do some caching here, but testing shows the cache is never hit.
// Maybe I could cache for future ticks? With a decay to prevent memory bloat?
/*var roomOldFindPath = Room.prototype.findPath;
Room.prototype.findPath = function(fromPos, toPos, opts) {
    if (Memphis.getPathCache(fromPos, toPos)) {
        return Memphis.getPathCache(fromPos, toPos);
    }
    var path = roomOldFindPath.apply(this, [fromPos, toPos, opts]);
    Memphis.cachePath(fromPos, toPos, path);
    return path;
}*/

/*var roomOldFind = Room.prototype.find;
Room.prototype.find = function(type, opts) {
    Memphis.ensureValue("findCache", {}, this);

    var filter = typeof opts != "undefined" ? opts.filter : undefined;
    var initialFind = this.findCache[type];
    if (typeof initialFind == "undefined") {
        initialFind = roomOldFind.apply(this, [type]);
        this.findCache[type] = initialFind;
    }
    if (filter) initialFind = _.filter(initialFind, filter);
    return initialFind;
}*/


// --------------------------------------------------------------

// Resource extentions ------------------------------------------
Resource.prototype.intentAllowed = function() {
    var creepsIntent = Utils.creepsIntentOn(this);
    var amountUnclaimed = this.amount;
    for (var i in creepsIntent) {
        var creep = creepsIntent[i];
        amountUnclaimed -= creep.carryCapacity - _.sum(creep.carry);
    }
    return amountUnclaimed > 0;
}
// --------------------------------------------------------------
 
// Game extentions ----------------------------------------------
Game.stats = function() {
    var creepRoleCount = {};
    var creepValues = {};
    
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (!creepRoleCount[creep.memory.role]) {
            creepRoleCount[creep.memory.role] = 0;
        }
        creepRoleCount[creep.memory.role] += 1;
        
        var creepValue = Utils.bodyCost(creep.rawBody());
        if (!creepValues[creepValue]) {
            creepValues[creepValue] = 0;
        }
        creepValues[creepValue] += 1;
    }
    
    // Roles.
    console.log("Creep Role Count:\n");
    for (var role in creepRoleCount) {
        console.log("    " + role + ": " + creepRoleCount[role]);
    }
    
    // Values.
    console.log("\nCreep Value Count:\n");
    var sortedValues = Utils.sortObjectByProperties(creepValues);
    for (var i in sortedValues) {
        var pair = sortedValues[i];
        console.log("    " + pair[0] + ": " + pair[1]);
    }
}
 // --------------------------------------------------------------

 // Controller extentions ----------------------------------------
/**
* Game StructureController class
* @class StructureController
*/

/**
* A wrapper for the numAllowed functions. Returns the number of allowed structures in the controller's room
* given the structure type.
* @param structureType One of the STRUCTURE_* constants.
* @returns {number} The number of structures of structureType allowed.
*/
StructureController.prototype.numAllowedStructures = function(structureType) {
    if (structureType == STRUCTURE_TOWER) return this.numAllowedTowers();
    if (structureType == STRUCTURE_EXTENSION) return this.numAllowedExtentions();
    throw new Error("StructureController.numAllowedStructures: Unsupported structure type " + structureType);
}

/**
* Returns the number of extensions allowed in the controller's room.
* @returns {number}
*/
StructureController.prototype.numAllowedExtentions = function() {
    switch(this.level) {
        case 0:
            return 0;
        case 1:
            return 0;
        case 2:
            return 5;
        case 3:
            return 10;
        case 4:
            return 20;
        case 5:
            return 30;
        case 6:
            return 40;
        case 7:
            return 50;
        case 8:
            return 60;
        default:
            return 0;
    }
}

/**
* Returns the number of towers allowed in the controller's room.
* @returns {number}
*/ 
StructureController.prototype.numAllowedTowers = function() {
    switch(this.level) {
        case 1:
        case 2:
            return 0;
        case 3:
        case 4:
            return 1;
        case 5:
        case 6:
            return 2;
        case 7:
            return 3;
        case 8:
            return 6;
    }
}

/**
* Gets the standard number of each of the essential creep roles, depending on the
* level of the room (which affects how large our expected creeps are).
* @returns {Object} An object with the role numbers.
*/
StructureController.prototype.getStandardCreepRoleNumbers = function() {
    var numSources = this.room.find(FIND_SOURCES).length;
    switch(this.level) {
        case 0:
        case 1:
        case 2:
        case 3:
            return {
                numHarvesters: 4,
                numBuilders: 4,
                numUpgraders: 2
            };
        case 4:
        case 5:
            return {
                numHarvesters: 2 * numSources,
                numBuilders: 2 * numSources,
                numUpgraders: 2
            };
        case 6:
        case 7:
        case 8:
            return {
                numHarvesters: numSources + 1,
                numBuilders: numSources,
                numUpgraders: 1
            }
    }
}
// --------------------------------------------------------------

// Structure extensions -----------------------------------------
/**
* Game Structure class
* @class Structure
*/

/**
* Returns true if the structure is walkable.
* @returns {boolean}
*/
Structure.prototype.isWalkable = function() {
    return this.structureType === STRUCTURE_ROAD ||
        this.structureType === STRUCTURE_CONTAINER ||
        (this.structureType === STRUCTURE_RAMPART && this.my);
}
// --------------------------------------------------------------

module.exports.stats = Game.stats;