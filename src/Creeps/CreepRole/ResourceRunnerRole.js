/**
* This creep role is responsible for transporting resources within a room.
* @class
* @extends CreepRole
*/
var ResourceRunnerRole = function() {};
ResourceRunnerRole.prototype = Object.create(CreepRole.prototype);

ResourceRunnerRole.run = function(creep) {
	var runNeeded = false;

	// First, we want to keep the spawn and extensions full.
	var structuresThatNeedFilling = creep.room.find(FIND_MY_STRUCTURES, {filter:(s) => {(s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION) && s.energy < s.energyCapacity}});
	if (structuresThatNeedFilling.length) {
		runNeeded = true;
		if (creep.carry.energy > 0) {
			creep.depositToNearestStructure(structuresThatNeedFilling);
			return;
		}
	}

	// Next, empty containers into storage.
	var storage = creep.room.storage;
	var fullContainers = creep.room.find(FIND_STRUCTURES, {filter:(s) => {s.structureType == STRUCTURE_CONTAINER && _.sum(s.store) > 0}});
	if (storage && fullContainers.length && _.sum(creep.carry) < creep.carryCapacity) {
		// TODO: complete implementation.
	}
}