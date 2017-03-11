/**
* The default role for spawns.
* @class
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
* @typedef {Object} Spawn.Colony
* @property numDesiredWorkers {number} The number of workers that should be in the colony.
* @property workers {Array<string>} An array of names of active workers in the colony.
* @property numDesiredTraders {number} The number of traders that should be in the colony.
* @property traders {Array<string>} An array of names of active traders in the colony.
* @property direction {Direction} The direction of the colony. Must be one of BOTTOM, TOP, LEFT, RIGHT.
*/

SpawnRole.run = function(spawn) {
    var neededEnergy = spawn.memory.emergencyEnergy ? spawn.memory.emergencyEnergy : 0;
    var emergencyEnergy = neededEnergy;

    // First make sure everything essential is spawned.
    neededEnergy += SpawnRole.spawnEssentialCreepTypes(spawn);
    
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
	Memphis.ensureValue("numHarvesters", 4, spawn.memory);
	var numHarvesters = spawn.memory.numHarvesters;
	Memphis.ensureValue("numBuilders", 4, spawn.memory);
	var numBuilders = spawn.memory.numBuilders;
	Memphis.ensureValue("numUpgraders", 2, spawn.memory);
	var numUpgraders = spawn.memory.numUpgraders;
	Memphis.ensureValue("numMilitia", 0, spawn.memory);
	var numMilitia = spawn.memory.numMilitia;

	// Creep types, in order of priority.
	var creepTypes = [roleNames.HARVESTER, roleNames.MILITIA, roleNames.UPGRADER, roleNames.BUILDER];
    var creepNums = [numHarvesters, numMilitia, numUpgraders, numBuilders];

    var createResult = null;
    var neededEnergy = 0;
    for (var i in creepTypes) {
        var creepType = creepTypes[i];
        var creepNum = creepNums[i];
        var roleCreeps = spawn.room.find(FIND_MY_CREEPS, { filter: function(c) { return c.memory.role == creepType } });
        createResult = checkAndBuildCreep(spawn, creepType, creepNum - roleCreeps.length);
        var neededForNextCreep = createResult.e;
        neededEnergy += neededForNextCreep;

        // If we managed to create a creep, stop trying to create.
        if (typeof createResult.name === "string") {
            break;
        }
    }
    return neededEnergy;
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

        // REWRITETODO: Consider decomposing these blocks since they are similar.
        // First, try to build a worker.
        Memphis.ensureValue("numDesiredWorkers", 1, colony);
        Memphis.ensureValue("workers", [], colony);
        Memphis.removeDeadCreepsByName(colony.workers);
        createResult = checkAndBuildCreep(spawn, roleNames.COLONIST_WORKER, colony.numDesiredWorkers - colony.workers.length, {home: spawn.id, colonyDirection: colony.direction, colonyIndex: colonyIndex});
        neededEnergy += createResult.e;
        if (typeof createResult.name === "string") {
            colony.workers.push(createResult.name);
            break;
        }
        
        Memphis.ensureValue("traders", [], colony);
        if (typeof colony.numDesiredTraders === "undefined" && colony.roadsBuilt) colony.numDesiredTraders = 1;
        Memphis.removeDeadCreepsByName(colony.traders);
        createResult = checkAndBuildCreep(spawn, roleNames.COLONIST_TRADER, colony.numDesiredTraders - colony.traders.length, {home: spawn.id, colonyDirection: colony.direction, colonyIndex: colonyIndex});
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
SpawnRole.checkAndBuildCreep = function(spawn, roleName, numNeeded, additionalMemory) {
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