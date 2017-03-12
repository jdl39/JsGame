/**
* A protmanteu of MEMory and interFACE, Memphis is a namespace that provides
* functions to access the global Memory object. Memory should never be accessed
* outside of a Memphis function.
*
* @namespace
*/
var Memphis = {};

Memphis.keyNames = {
	ALLOWED_INTENT: "allowedIntent",
	NEEDS_REPAIR: "needsRepair",
	ROOM_REPAIR_CHECK_COUNTER: "roomRepairCheckCounter",
}

/**
* Ensures that a key in memory is defined. Used mainly internally.
* @param key {string} The key to ensure is defined.
* @param [memoryDefault=EmptyObject] {any} The default value to set if undefined.
* @param [memoryObject=Memory] {Object} The memory object to check. Top level Memory by default.
*/
Memphis.ensureValue = function(key, memoryDefault, memoryObject) {
	if (typeof memoryDefault == "undefined") memoryDefault = {};
	if (typeof memoryObject == "undefined") memoryObject = Memory;
	if (typeof memoryObject[key] === "undefined") memoryObject[key] = memoryDefault;
}

/**
* Takes either an array of ids or an object with ids as properties
* and removes any ids that no longer correspond with game objects.
* @param memObj {Object|Array} What to remove dead ids from.
*/
Memphis.removeDeadObjectsById = function(memObj) {
	var iterationObject = memObj;
	if (typeof memObj == "object") iterationObject = Object.keys(memObj);
	for (var i = 0; i < iterationObject.length; i++) {
		var id = iterationObject[i];
		if (!Game.getObjectById(id)) {
			if (memObj instanceof Array) {
				memObj.splice(i, 1);
				i--;
			} else {
				delete memObj[id];
			}
		}
	}
}

/**
* Takes either an array of creep names or an object with creep names as properties
* and removes any names that no longer correspond with live creeps.
* @param memObj {Object|Array} What to remove dead names from.
*/
Memphis.removeDeadCreepsByName = function(memObj) {
	var iterationObject = memObj;
	if (typeof memObj == "object") iterationObject = Object.keys(memObj);
	for (var i = 0; i < iterationObject.length; i++) {
		var name = iterationObject[i];
		if (!Game.creeps[name]) {
			if (memObj instanceof Array) {
				memObj.splice(i, 1);
				i--;
			} else {
				delete memObj[id];
			}
		}
	}
}

/**
* Sets the allowed intent for a target.
* @param target {RoomObject} The target
* @param allowed {number} Number of allowed intenders.
*/
Memphis.setAllowedIntent = function(target, allowed) {
	Memphis.ensureValue(Memphis.keyNames.ALLOWED_INTENT);
	Memory.allowedIntent[target.id] = allowed;
}

/**
* Gets the allowed intent for a target. Calculates the allowed intent if necessary.
* @param target {RoomObject} The target
*/
Memphis.getAllowedIntent = function(target) {
	Memphis.ensureValue(Memphis.keyNames.ALLOWED_INTENT);
    if (typeof Memory.allowedIntent[target.id] === "undefined") Utils.recalcAllowedIntent(target);
    
    return Memory.allowedIntent[target.id];
}

/**
* Marks the structure as in need of repair.
* @param structure {Structure} Structure to mark.
*/
Memphis.markForRepair = function(structure) {
	Memphis.ensureValue(Memphis.keyNames.NEEDS_REPAIR);
    Memory.needsRepair[structure.id] = true;
}

/**
* Check if the structure is marked for repair.
* @param structure {Structure} The structure to check.
* @returns {boolean} True if the structure is marked for repair.
*/
Memphis.needsRepair = function(structure) {
	Memphis.ensureValue(Memphis.keyNames.NEEDS_REPAIR);
	if (Memory.needsRepair[structure.id]) return true;
	return false;
}

/**
* Returns an array of structures that have been marked for repair.
* @returns {Array<Structure>} Structures that need to be repaired.
*/
Memphis.getStructuresThatNeedRepair = function() {
	Memphis.ensureValue(Memphis.keyNames.NEEDS_REPAIR);
	var structures = [];
	for (var id in Memory.needsRepair) {
		if (Memory.needsRepair[id]) structures.push(Game.getObjectById(id));
	}
	return structures;
}

/**
* Checks if the room needs a creep to perform a repair check in it.
* Repair check is only for unowned structures. Owned structures are
* checked every tick by {@link Memphis.updateNeedsRepair}.
* @param room {Room} The room to check.
* @returns {boolean} True if check needed.
*/
Memphis.roomNeedsRepairCheck = function(room) {
	Memphis.ensureValue(Memphis.keyNames.ROOM_REPAIR_CHECK_COUNTER);
	Memphis.ensureValue(room.name, 0, Memory.roomRepairCheckCounter);
	return Memory.roomRepairCheckCounter[room.name] <= 0;
}

/**
* Called every tick by {@link Utils.onTick}. Updates the structures that are marked for repair,
* removing them if they are fully repaired. Also updates the counters
* for roomRepairCheckCounter.
*/
Memphis.repairUpdate = function() {
	// Decrement room check counters.
	Memphis.ensureValue(Memphis.keyNames.ROOM_REPAIR_CHECK_COUNTER);
	for (var roomName in Memory.roomRepairCheckCounter) {
		Memory.roomRepairCheckCounter[roomName] -= 1;
		if (Memory.roomRepairCheckCounter <= 0) delete Memory.roomRepairCheckCounter[roomName];
	}
    
    // Remove objects that no longer need repair.
    Memphis.ensureValue(Memphis.keyNames.NEEDS_REPAIR);
    for (var id in Memory.needsRepair) {
        var object = Game.getObjectById(id);
        if (!object ||
            !(object instanceof Structure) ||
            object.hits == object.hitsMax) {
            delete Memory.needsRepair[id];
        }
    }
    
    // Mark owned structures for repair if necessary.
    for (var id in Game.structures) {
        var structure = Game.structures[id];
        if (structure.hits * 1.0 / structure.hitsMax <= structureConstants.OWNED_STRUCTURE_REPAIR_LIMIT) {
            Memory.needsRepair[id] = true;
        }
    }
}

/**
* Marks the fact that new construction sites were already looked for in the given room
* this tick.
* @param room {Room} The room to mark.
*/
Memphis.markConstructionSitesFound = function(room) {
	Memphis.ensureValue("GlobalCreepMemory");
	Memphis.ensureValue("foundConstructionSitesForRoom", {}, Memory.GlobalCreepMemory);
	Memory.GlobalCreepMemory.foundConstructionSitesForRoom[room.id] = true;
}

/**
* Returns true if a builder creep already computed new construction sites for the room.
* Computing sites is an expensive operation, and we don't want multiple builder creeps
* all looking for new sites for the same room.
* @param room {Room} The room checked.
* @returns {boolean} True if sites were already found. False otherwise.
*/
Memphis.constructionSitesFoundThisTick = function(room) {
	Memphis.ensureValue("GlobalCreepMemory");
	Memphis.ensureValue("foundConstructionSitesForRoom", {}, Memory.GlobalCreepMemory);
	if (Memory.GlobalCreepMemory.foundConstructionSitesForRoom[room.id]) return true;
	return false;
}

/**
* Mark that there is a road between a given spawn and the object.
* Used by builder creeps.
* @param spawn {StructureSpawn} The spawn.
* @param obj {RoomObject|string} The object (or obj id) that a road has been built to.
*/
Memphis.markSpawnHasRoadsTo = function(spawn, obj) {
	Memphis.ensureValue("hasRoadsTo", {}, spawn.memory);
	var id = typeof obj === "string" ? obj : obj.id;
	spawn.memory.hasRoadsTo[id] = true;
}

/**
* Returns true if there is a road built between the spawn and the
* object. Relies on {@link Memphis.markSpawnHasRoadsTo} to determine
* if there is a road.
* @param spawn {StructureSpawn} The spawn.
* @param obj {RoomObject|string} The other object (or object id).
* @returns {boolean} True if there is a road marked between the spawn and the obj.
*/
Memphis.spawnHasRoadsTo = function(spawn, obj) {
	Memphis.ensureValue("hasRoadsTo", {}, spawn.memory);
	var id = typeof obj === "string" ? obj : obj.id;
	if (spawn.memory.hasRoadsTo[id]) return true;
	return false;
}

/**
* Marks that the spawn's colony at colony index has at least 1 road.
* @param spawn {StructureSpawn} The spawn
* @param colonyIndex {number} The index of the colony for the spawn. 
*/
Memphis.markColonyRoadsBuilt = function(spawn, colonyIndex) {
	spawn.memory.colonies[colonyIndex].roadsBuilt = true;
}

/**
* Marks that the spawn's colony at colony index has at least 1 container.
* @param spawn {StructureSpawn} The spawn
* @param colonyIndex {number} The index of the colony for the spawn. 
*/
Memphis.markColonyContainersBuilt = function(spawn, colonyIndex) {
	spawn.memory.colonies[colonyIndex].containersBuilt = true;
}

/**
* Called every tick by {@link Memphis.cleanupAllMemory}. Removes creep memory that is no longer associated with a creep.
*/
Memphis.cleanupCreepMemory = function() {
	// Cleanup bad memory.
    for (var key in Memory.creeps) {
        if (!Game.creeps[key]) {
            delete Memory.creeps[key];
        }
    }
}

/**
* Called every tick by {@link Utils.onTick}. Cleans up Memory to remove unneeded memory.
*/
Memphis.cleanupAllMemory = function() {
	Memphis.cleanupCreepMemory();

	Memphis.ensureValue("GlobalCreepMemory");
	Memory.GlobalCreepMemory.foundConstructionSitesForRoom = {};
}