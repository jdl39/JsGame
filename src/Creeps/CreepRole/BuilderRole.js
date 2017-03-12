/**
* This creep role is responsible for building and repairing in its room.
* @class
* @extends CreepRole
*/
var BuilderRole = function() {};
BuilderRole.prototype = Object.create(CreepRole.prototype);

BuilderRole.buildingCheck = function(creep) {
	if(creep.memory.building && creep.carry.energy == 0) {
        creep.memory.building = false;
	}
	if(!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
	    creep.memory.building = true;
	}
}

BuilderRole.checkForNewConstructionType = function(creep, structureType) {
	var numStructure = creep.room.find(FIND_MY_STRUCTURES, {filter: (s) => {return s.structureType == structureType;}}).length;
	var numAllowedStructures = creep.room.controller.numAllowedStructures(structureType);
	var bestSite = null;
	if (numStructure < numAllowedStructures) {
		bestSite = SiteFinder.findSiteForStructure(creep.room, structureType);
		if (bestSite) creep.room.createConstructionSite(bestSite, structureType);
	}
	return bestSite;
}

BuilderRole.checkForNewRoads = function(spawn) {
	var site = null;

	var controller = spawn.room.controller;
	if (!Memphis.spawnHasRoadsTo(spawn, controller)) {
		var s = SiteFinder.continueRoadTo(spawn.pos, controller.pos);
		if (s) site = s;
		else Memphis.markSpawnHasRoadsTo(spawn, controller);
	}

	var sources = spawn.room.find(FIND_SOURCES);
	for (var i in sources) {
	    if (!Memphis.spawnHasRoadsTo(spawn, sources[i])) {
	    	var s = SiteFinder.continueRoadTo(spawn.pos, sources[i].pos);
	    	if (s) site = s;
	    	else Memphis.markSpawnHasRoadsTo(spawn, sources[i]);
	    }
	}

	var myStructures = spawn.room.find(FIND_MY_STRUCTURES);
	for (var i in myStructures) {
	    if (myStructures[i] == spawn) continue;
	    if (!Memphis.spawnHasRoadsTo(spawn, myStructures[i])) {
	    	var s = SiteFinder.continueRoadTo(spawn.pos, myStructures[i].pos);
	    	if (s) site = s;
	    	else Memphis.markSpawnHasRoadsTo(spawn, myStructures[i]);
	    }
	}

	return site;
}

BuilderRole.checkForNewConstruction = function(creep) {
	if (Memphis.constructionSitesFoundThisTick(creep.room)) return null;
	Memphis.markConstructionSitesFound(creep.room);

	var site = null;

	// Check for new construction in priority order.
	// First, check for new towers.
	site = BuilderRole.checkForNewConstructionType(creep, STRUCTURE_TOWER);
	// Next, check for new extensions.
	if (!site) site = BuilderRole.checkForNewConstructionType(creep, STRUCTURE_EXTENSION);
	// Finally, check for new roads.
	if (!site) {
		var spawn = creep.room.find(FIND_MY_STRUCTURES, {filter: (s) => {return s.structureType == STRUCTURE_SPAWN;}})[0];
	    site = BuilderRole.checkForNewRoads(spawn);
	}

	return site;
}

BuilderRole.run = function(creep) {
	// First, we check for wear on the unowned structures.
	creep.checkRoadRepair();

	// Next, check if we are building or gathering energy.
	BuilderRole.buildingCheck(creep);

	// If we are gathering, we need only to find energy to gather.
	if (!creep.memory.building) {
		creep.harvestOrWithdrawFromNearestSource();
		return;
	}

	// If not gathering, build.
	// First, check for repairs.
    if (creep.repairNearestStructureNeedingRepair()) return;
    // Then, check for new buildings.
	if (creep.buildNearestSite()) return;
	// If there have been no sites manually laid out, then auto-generate sites.
	var newConstructionSite = BuilderRole.checkForNewConstruction(creep);
	if (newConstructionSite) {
		creep.moveTo(newConstructionSite);
		return;
	}

	// If there is nothing to build, might as well upgrade.
	creep.upgradeNearestController();
}