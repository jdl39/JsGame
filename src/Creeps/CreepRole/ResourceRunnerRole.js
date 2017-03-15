/**
* This creep role is responsible for transporting resources within a room.
* @class
* @extends CreepRole
*/
var ResourceRunnerRole = function() {};
ResourceRunnerRole.prototype = Object.create(CreepRole.prototype);

ResourceRunnerRole.run = function(creep) {
	var runNeeded = false;

	// First, we want to keep the spawn and extensions and towers full.
	var structuresThatNeedFilling = creep.room.find(FIND_MY_STRUCTURES, {filter:(s) => {
		return (s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION) &&
				s.energy < s.energyCapacity}});
	if (structuresThatNeedFilling.length) {
		runNeeded = true;
		if (creep.carry.energy > 0) {
			creep.depositToNearestStructure(structuresThatNeedFilling);
			return;
		} else if (_.sum(creep.carry) == 0) {
			creep.withdrawFromNearestContainer();
			return;
		}
	}

	// Next, empty containers into storage.
	var storage = creep.room.storage;
	var fullContainers = creep.room.find(FIND_STRUCTURES, {filter:(s) => {return s.structureType == STRUCTURE_CONTAINER && _.sum(s.store) > 0}});
	if (storage && fullContainers.length && _.sum(creep.carry) < creep.carryCapacity) {
		creep.harvestOrWithdrawFromNearestSource(fullContainers, RESOURCE_ALL);
		return;
	}

	// Finally, if there are no structures to fill and no containers to withdraw from,
	// or if we are just too full, throw the resources into storage.
	creep.goToAndDeposit(storage, RESOURCE_ALL);

	// TODO: Add requests, such as moving minerals to terminals or labs.
}