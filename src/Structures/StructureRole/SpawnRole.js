/**
* The default role for spawns.
* @class
* @extends StructureRole
*/
var SpawnRole = function() {};
SpawnRole.prototype = Object.create(StructureRole.prototype);

/**
* The result of a creep spawn.
* @typedef {Object} SpawnRole.CreateResult
* @property e {number} The energy required. 0 if no creation is required.
* @property name {string|Err} The result of the createCreep. Either a name or an error.
*/

/**
* Objects within each spawn.memory.colonies. They represent data necessary to keep
* a colony running.
* @typedef {Object} SpawnRole.Colony
* @property numDesiredWorkers {number} The number of workers that should be in the colony.
* @property workers {Array<string>} An array of names of active workers in the colony.
* @property numDesiredTraders {number} The number of traders that should be in the colony.
* @property traders {Array<string>} An array of names of active traders in the colony.
* @property direction {Direction} The direction of the colony. Must be one of BOTTOM, TOP, LEFT, RIGHT.
*/

SpawnRole.run = function(spawn) {
    SpawnRole.updateForControllerLevel(spawn);

    var neededEnergy = spawn.memory.emergencyEnergy ? spawn.memory.emergencyEnergy : 0;
    var emergencyEnergy = neededEnergy;

    // First make sure everything essential is spawned.
    neededEnergy += SpawnRole.spawnEssentialCreepTypes(spawn);

    // Next check for mining.
    SpawnRole.checkAndBuildMiner(spawn);
    
    // Then, see if we have any colonies we need to upkeep.
    if (neededEnergy <= emergencyEnergy) {
        neededEnergy += SpawnRole.handleColonies(spawn);
    }
    
    // We want to reserve any energy we will need to create the creeps we need.
    spawn.memory.reservedEnergy = neededEnergy;
}

/**
* Runs through essential creeps in priority order and tries to spawn the first one that
* is understaffed. TODO: Currently won't work with multiple spawns.
* @param spawn {StructureSpawn} The spawn.
* @returns {number} Energy needed for the creation.
*/
SpawnRole.spawnEssentialCreepTypes = function(spawn) {
	var numHarvesters = spawn.memory.numHarvesters;
	var numBuilders = spawn.memory.numBuilders;
	var numUpgraders = spawn.memory.numUpgraders;
	var numMilitia = spawn.memory.numMilitia;
    var numResourceRunners = spawn.memory.numResourceRunners;

	// Creep types, in order of priority.
	var creepTypes = [roleNames.HARVESTER, roleNames.MILITIA, roleNames.UPGRADER, roleNames.BUILDER, roleNames.RESOURCE_RUNNER];
    var creepNums = [numHarvesters, numMilitia, numUpgraders, numBuilders, numResourceRunners];

    var createResult = null;
    var neededEnergy = 0;
    for (var i in creepTypes) {
        var creepType = creepTypes[i];
        var creepNum = creepNums[i];
        var roleCreeps = spawn.room.find(FIND_MY_CREEPS, { filter: function(c) { return c.memory.role == creepType } });
        createResult = SpawnRole.checkAndBuildCreep(
            spawn,
            creepType,
            creepNum - roleCreeps.length,
            (creepType == roleNames.HARVESTER && roleCreeps.length == 0) /* TODO: Do we want this? kinda dangerous when we only have 2 harvesters... */);
        var neededForNextCreep = createResult.e;
        neededEnergy += neededForNextCreep;

        // If we managed to create a creep, stop trying to create.
        if (typeof createResult.name === "string") {
            break;
        }
    }
    return neededEnergy;
}

SpawnRole.checkAndBuildMiner = function(spawn) {
    if (spawn.memory.extractorBuilt || spawn.room.find(FIND_MY_STRUCTURES, {filter:(s) => {return s.structureType == STRUCTURE_EXTRACTOR}}).length) spawn.memory.extractorBuilt = true;
    else return;

    var mineral = spawn.room.find(FIND_MINERALS)[0];
    if (mineral && mineral.mineralAmount > 0) {
        var minerNum = spawn.room.find(FIND_MY_CREEPS, {filter:(c) => {return c.memory.role == roleNames.MINER}}).length;
        SpawnRole.checkAndBuildCreep(spawn, roleNames.MINER, 1 - minerNum);
    }
}

/**
* Handles the maintenence of the spawn's colonies.
* @param spawn {StructureSpawn} The spawn
* @returns {number} Energy needed to spawn the colonists.
*/
SpawnRole.handleColonies = function(spawn) {
	Memphis.ensureValue("colonies", {}, spawn.memory);

	var neededEnergy = 0;
    for (var colonyIndex in spawn.memory.colonies) {
        var colony = spawn.memory.colonies[colonyIndex];

        // First check: should we upgrade colony to owned room.
        Memphis.ensureValue("upgradeToOwnedRoom", false, colony);
        Memphis.ensureValue("claimerDeployed", false, colony);
        if (colony.upgradeToOwnedRoom && !colony.claimerDeployed) {
            createResult = SpawnRole.checkAndBuildCreep(
                spawn,
                roleNames.CLAIMER,
                1,
                false,
                {home: spawn.id, colonyDirection: colony.direction, colonyIndex: colonyIndex});
            neededEnergy += createResult.e;
            if (typeof createResult.name === "string") {
                colony.claimerDeployed = true;
                colony.numDesiredTraders = 0;
                break;
            }
        }

        // REWRITETODO: Consider decomposing these blocks since they are similar.
        // First, try to build a worker.
        // BUG: If we are claiming, we still build workers; they are converted by the claimers.
        // however, if all claimers are dead, workers may not convert. Consider converting all workers
        // here if we are claiming.
        Memphis.ensureValue("numDesiredWorkers", 2, colony);
        Memphis.ensureValue("workers", [], colony);
        Memphis.removeDeadCreepsByName(colony.workers);
        createResult = SpawnRole.checkAndBuildCreep(
            spawn,
            roleNames.COLONIST_WORKER,
            colony.numDesiredWorkers - colony.workers.length,
            false,
            {home: spawn.id, colonyDirection: colony.direction, colonyIndex: colonyIndex});
        neededEnergy += createResult.e;
        if (typeof createResult.name === "string") {
            colony.workers.push(createResult.name);
            break;
        }
        
        Memphis.ensureValue("traders", [], colony);
        if (typeof colony.numDesiredTraders === "undefined" && colony.containersBuilt) colony.numDesiredTraders = 2;
        Memphis.removeDeadCreepsByName(colony.traders);
        createResult = SpawnRole.checkAndBuildCreep(
            spawn,
            roleNames.COLONIST_TRADER,
            colony.numDesiredTraders - colony.traders.length,
            false,
            {home: spawn.id, colonyDirection: colony.direction, colonyIndex: colonyIndex});
        neededEnergy += createResult.e;
        if (typeof createResult.name === "string") {
            colony.traders.push(createResult.name);
            break;
        }
    }
    return neededEnergy;
}

/**
* Function responsible for actually creating the creeps.
* @param spawn {StructureSpawn} The spawn
* @param roleName {string} The role for the spawn. One of the {@link roleName} constants.
* @param numNeeded {number} The number to spawn. We can only spawn 1, but if we need more, we may opt for a smaller version of the creep.
* @param [additionalMemory=EmptyObject] {Object} Memory in addition to creep role that the creep should be given.
* @returns {SpawnRole.CreateResult} {@link SpawnRole.CreateResult}
*/
SpawnRole.checkAndBuildCreep = function(spawn, roleName, numNeeded, useSmallest, additionalMemory) {
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
        if (numNeeded > 1 || useSmallest) {
            variant += numNeeded - 1;
            if (variant >= creepBodies[roleName].length || useSmallest) variant = creepBodies[roleName].length - 1;
            eNeeded = Utils.bodyCost(creepBodies[roleName][variant]);
        }
        
        if (spawn.energyIncludingExtentions() >= eNeeded) {
            errCode = spawn.createCreep(creepBodies[roleName][variant], undefined, additionalMemory);
        } else if (spawn.energyCapacityIncludingExtentions() < eNeeded) {
            // We simply cannot build this type.
            eNeeded = 0;
        }
    }
    return {e: eNeeded, name: errCode};
}

SpawnRole.updateForControllerLevel = function(spawn) {
    Memphis.ensureValue("updatedForControllerLevel", 0, spawn.memory);
    if (spawn.room.controller.level == spawn.memory.updatedForControllerLevel) return;

    // Update the creep numbers.
    Memphis.ensureValue("numHarvesters", 0, spawn.memory);
    Memphis.ensureValue("numBuilders", 0, spawn.memory);
    Memphis.ensureValue("numUpgraders", 0, spawn.memory);
    Memphis.ensureValue("numMilitia", 0, spawn.memory);
    Memphis.ensureValue("numResourceRunners", 0, spawn.memory);
    var updateNumbers = spawn.room.controller.getStandardCreepRoleNumbers();
    spawn.memory.numHarvesters = updateNumbers.numHarvesters;
    spawn.memory.numBuilders = updateNumbers.numBuilders;
    spawn.memory.numUpgraders = updateNumbers.numUpgraders;
    spawn.memory.numResourceRunners = updateNumbers.numResourceRunners;

    spawn.memory.updatedForControllerLevel = spawn.room.controller.level;
}