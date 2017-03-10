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
Memphis.ensureValue(key, memoryDefault, memoryObject) {
	if (typeof memoryDefault == "undefined") memoryDefault = {};
	if (typeof memoryObject == "undefined") memoryObject = Memory;
	if (typeof memoryObject[key] === "undefined") memoryObject[key] = memoryDefault;
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
* Checks if the room needs a creep to perform a repair check in it.
* @param room {Room} The room to check.
* @returns {boolean} True if check needed.
*/
Memphis.roomNeedsRepairCheck = function(room) {
	Memphis.ensureValue(Memphis.keyNames.ROOM_REPAIR_CHECK_COUNTER);
	Memphis.ensureValue(room.name, 0, Memory.roomRepairCheckCounter);
	return Memory.roomRepairCheckCounter[room.name] <= 0;
}

/**
* Called every tick. Updates the structures that are marked for repair,
* removing them if they are fully repaired. Also updates the counters
* for roomRepairCheckCounter.
*/
Memphis.updateNeedsRepair = function() {
	Memphis.ensureValue(Memphis.keyNames.ROOM_REPAIR_CHECK_COUNTER);
	for (var roomName in Memory.roomRepairCheckCounter) {
		Memory.roomRepairCheckCounter[roomName] -= 1;
		if (Memory.roomRepairCheckCounter <= 0) delete Memory.roomRepairCheckCounter[roomName];
	}
    
    Memphis.ensureValue(Memphis.keyNames.NEEDS_REPAIR);
    for (var id in Memory.needsRepair) {
        var object = Game.getObjectById(id);
        if (!object ||
            !(object instanceof Structure) ||
            object.hits == object.hitsMax) {
            delete Memory.needsRepair[id];
        }
    }
    
    for (var id in Game.structures) {
        var structure = Game.structures[id];
        if (structure.hits * 1.0 / structure.hitsMax <= structureConstants.OWNED_STRUCTURE_REPAIR_LIMIT) {
            Memory.needsRepair[id] = true;
        }
    }
}