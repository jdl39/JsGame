// Returns true if creep is needed, false otherwise.
var checkAndBuildCreep = function(spawn, roleName, numNeeded, additionalMemory) {
    if (typeof additionalMemory === "undefined") additionalMemory = {};
    additionalMemory.role = roleName;

    var eNeeded = 0;
    var errCode = OK;
    if (numNeeded > 0) {
        var variant = 0;
        eNeeded = Utils.bodyCost(creepBodies[roleName][variant]);
        while (spawn.energyCapacityIncludingExtentions() < eNeeded && variant < creepBodies[roleName].length - 1) {
            variant += 1;
            eNeeded = Utils.bodyCost(creepBodies[roleName][variant]);
        }
        
        // If we are really low on workers, we make a littler dude.
        if (numNeeded > 1) {
            variant += numNeeded - 1;
            if (variant >= creepBodies[roleName].length) variant = creepBodies[roleName].length - 1;
            eNeeded = Utils.bodyCost(creepBodies[roleName][variant]);
        }
        
        // TODO: maybe re-add die out logic?
        
        if (spawn.energyIncludingExtentions() >= eNeeded) {
            errCode = spawn.createCreep(creepBodies[roleName][variant], undefined, additionalMemory);
        } else if (spawn.energyCapacityIncludingExtentions() < eNeeded) {
            // We simply cannot build this type.
            eNeeded = 0;
        }
    }
    return {e: eNeeded, name: errCode};
}

var spawnRoleDefault = {
	run: function(spawn, numHarvesters, numBuilders, numUpgraders, numMilitia) {
	    // First make sure everything essential is spawned.
	    if (numHarvesters === undefined) {
	        numHarvesters = 1;
	    }
	    if (numBuilders === undefined) {
	        numBuilders = 1;
	    }
	    if (numUpgraders === undefined) {
	        numUpgraders = 1;
	    }
	    if (numMilitia === undefined) {
	        numMilitia = 1;
	    }
	    
	    var neededEnergy = spawn.memory.emergencyEnergy ? spawn.memory.emergencyEnergy : 0;
	    var emergencyEnergy = neededEnergy;
	    var creepTypes = [roleNames.HARVESTER, roleNames.MILITIA, roleNames.UPGRADER, roleNames.BUILDER];
	    var creepNums = [numHarvesters, numMilitia, numUpgraders, numBuilders];
	    var createResult = null;
	    for (var i in creepTypes) {
	        var creepType = creepTypes[i];
	        var creepNum = creepNums[i];
	        var roleCreeps = spawn.room.find(FIND_MY_CREEPS, { filter: function(c) { return c.memory.role == creepType } });
	        createResult = checkAndBuildCreep(spawn, creepType, creepNum - roleCreeps.length);
	        var neededForNextCreep = createResult.e;
	        neededEnergy += neededForNextCreep;
	        if (typeof createResult.name === "string") {
	            break;
	        }
	    }
	    
	    // Then, see if we have any colonies we need to upkeep.
	    if (neededEnergy <= emergencyEnergy) {
	        if (typeof spawn.memory.colonies === "undefined") spawn.memory.colonies = {};
	        for (var colonyIndex in spawn.memory.colonies) {
	            var colony = spawn.memory.colonies[colonyIndex];
	            
	            if (typeof colony.numDesiredWorkers == "undefined") colony.numDesiredWorkers = 1;
	            if (typeof colony.workers === "undefined") colony.workers = [];
	            for (var i in colony.workers) {
	                if (!Game.creeps[colony.workers[i]]) colony.workers.splice(i, 1);
	            }
	            createResult = checkAndBuildCreep(spawn, roleNames.COLONIST_WORKER, colony.numDesiredWorkers - colony.workers.length, {home: spawn.id, colonyDirection: colony.direction, colonyIndex: colonyIndex});
	            neededEnergy += createResult.e;
	            if (typeof createResult.name === "string") {
	                colony.workers.push(createResult.name);
	                break;
	            }
	            
	            if (typeof colony.numDesiredTraders === "undefined" && colony.roadsBuilt) colony.numDesiredTraders = 1;
	            if (typeof colony.traders === "undefined") colony.traders = [];
	            for (var i in colony.traders) {
	                if (!Game.creeps[colony.traders[i]]) colony.traders.splice(i, 1);
	            }
	            createResult = checkAndBuildCreep(spawn, roleNames.COLONIST_TRADER, colony.numDesiredTraders - colony.traders.length, {home: spawn.id, colonyDirection: colony.direction, colonyIndex: colonyIndex});
	            neededEnergy += createResult.e;
	            if (typeof createResult.name === "string") {
	                colony.traders.push(createResult.name);
	                break;
	            }
	        }
	    }
	    
	    spawn.memory.reservedEnergy = neededEnergy;
	}
}