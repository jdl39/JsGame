// roleBuilder
// Contains the logic for builder creeps.

var roleBuilder = {

    /** @param {Creep} creep **/
    run: function(creep) {
        
        creep.checkRoadRepair();

	    if(creep.memory.building && creep.carry.energy == 0) {
            creep.memory.building = false;
            creep.say('🔄 harvest');
	    }
	    if(!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
	        creep.memory.building = true;
	        creep.say('🚧 build');
	    }

	    if(creep.memory.building) {
	    	// First, check for repairs.
    		if (creep.repairNearestStructureNeedingRepair()) return;

    		// Then, check for new buildings.
	    	var target = creep.buildNearestSite();

	    	// If there have been no sites manually laid out, then auto-generate sites.
	    	// Fist, make sure we are full on Towers
	    	if (!target && !Memory.GlobalCreepMemory.foundConstructionSitesForRoom[creep.room.id]) {
	    	    var numTowers = creep.room.find(FIND_MY_STRUCTURES, {filter: (s) => {return s.structureType == STRUCTURE_TOWER;}}).length;
	    	    var numAllowedTowers = creep.room.controller.numAllowedTowers();
	    	    if (numTowers < numAllowedTowers) {
	    	        var bestSite = siteFinder.findSiteForTower(creep.room);
	    	        if (bestSite) {
	    	            creep.room.createConstructionSite(bestSite, STRUCTURE_TOWER);
	    	            Memory.GlobalCreepMemory.foundConstructionSitesForRoom[creep.room.id] = true;
	    	        }
	    	    }
	    	}
	    	
	    	// Then, make sure we are full on extentions.
	    	if (!target && !Memory.GlobalCreepMemory.foundConstructionSitesForRoom[creep.room.id]) {
	    		var numExtentions = creep.room.find(FIND_MY_STRUCTURES, {filter: (s) => {return s.structureType == STRUCTURE_EXTENSION;}}).length;
	    		var numAllowedExtentions = creep.room.controller.numAllowedExtentions();
	    		if (numExtentions < numAllowedExtentions) {
	    			var bestSite = siteFinder.findSiteForExtension(creep.room.find(FIND_MY_STRUCTURES, {filter: (s) => {return s.structureType == STRUCTURE_SPAWN;}})[0]);
	    			if (bestSite) {
	    				creep.room.createConstructionSite(bestSite, STRUCTURE_EXTENSION);
	    	            Memory.GlobalCreepMemory.foundConstructionSitesForRoom[creep.room.id] = true;
	    			}
	    		}
	    	}

	    	// We didn't build an extention, but maybe there is a road to build?
	    	if (!target && !Memory.GlobalCreepMemory.foundConstructionSitesForRoom[creep.room.id]) {
	    		var spawn = creep.room.find(FIND_MY_STRUCTURES, {filter: (s) => {return s.structureType == STRUCTURE_SPAWN;}})[0];
	    		if (typeof spawn.memory.hasRoadsTo === "undefined") spawn.memory.hasRoadsTo = {};
	    		var controller = creep.room.controller;
	    		if (!spawn.memory.hasRoadsTo[controller.id] && !siteFinder.continueRoadTo(spawn.pos, controller.pos)) {
	    			spawn.memory.hasRoadsTo[controller.id] = true;
	    		}
	    		var sources = creep.room.find(FIND_SOURCES);
	    		for (var i in sources) {
	    			if (!spawn.memory.hasRoadsTo[sources[i].id] && !siteFinder.continueRoadTo(spawn.pos, sources[i].pos)) {
	    				spawn.memory.hasRoadsTo[sources[i].id] = true;
	    			}
	    		}
	    		var myStructures = creep.room.find(FIND_MY_STRUCTURES);
	    		for (var i in myStructures) {
	    		    if (myStructures[i] == spawn) continue;
	    		    if (!spawn.memory.hasRoadsTo[myStructures[i].id] && !siteFinder.continueRoadTo(spawn.pos, myStructures[i].pos)) {
	    		        spawn.memory.hasRoadsTo[myStructures[i].id] = true;
	    		    }
	    		}
	    		
	    	    Memory.GlobalCreepMemory.foundConstructionSitesForRoom[creep.room.id] = true;
	    	}
	        
	        // If there is nothing to build, might as well upgrade.
	        if (!target) {
	            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller, {reusePath: 8});
                }
	        }
	    }
	    else {
	        creep.harvestOrWithdrawFromNearestSource();
	    }
	}
};