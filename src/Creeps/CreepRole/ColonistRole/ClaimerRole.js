/**
* This role is responsible for claiming a new room and building its spawn. It inherits
* from colonist role, because new owned rooms are built from colonies.
* @class
* @extends ColonistRole
*/
var ClaimerRole = function() {};
ClaimerRole.prototype = Object.create(ColonistRole.prototype);

ClaimerRole.harvestingCheck = function(creep) {
    if (creep.carry.energy == 0) {
        creep.memory.harvesting = true;
    } else if (creep.carry.energy == creep.carryCapacity) {
        creep.memory.harvesting = false;
    }
}

ClaimerRole.run = function(creep) {
	// First, head to the colony.
	if (ColonistRole.inHomeRoom(creep)) {
		ColonistRole.goToColony(creep);
		return;
	}

	// Then, claim the controller.
	if (!creep.room.controller.my) {
		creep.claimNearestController();
		return;
	}

	// Convert all ColonistWorkers to the cause of helping to build the spawn.
	var colonistWorkers = creep.room.find(FIND_MY_CREEPS, {filter: (c) => {return c.memory.role == roleNames.COLONIST_WORKER}});
	for (var i in colonistWorkers) {
		colonistWorkers[i].memory.role = roleNames.CLAIMER;
	}

	// To build the spawn, we need to harvest.
	ClaimerRole.harvestingCheck(creep);
	if (creep.memory.harvesting) {
		creep.harvestOrWithdrawFromNearestSource();
		return;
	}

	// Finally, we need to build the new spawn.
	// 1) Try to build it if already there.
	if (creep.buildNearestSite((s) => {return s.structureType == STRUCTURE_SPAWN})) return;
	// 2) If not there, find a site for it.
	if (creep.room.find(FIND_MY_STRUCTURES, {filter: (s) => {return s.structureType == STRUCTURE_SPAWN}}).length == 0) {
		creep.room.createConstructionSite(SiteFinder.findSiteForSpawn(creep.room), STRUCTURE_SPAWN);
		return;
	}
	// 3) If we've claimed the room and built a spawn, we are done. Convert to harvester.
	delete Game.getObjectById(creep.memory.home).memory.colonies[creep.memory.colonyIndex];
	// TODO BUG: We need to splice out the colony, but that means decrementing the index of all the colonists with a larger colony number.
	creep.memory.role = roleNames.HARVESTER;
}