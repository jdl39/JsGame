/**
* This role is responsible for harvesting energy from Sources in controlled rooms.
* @class
* @extends CreepRole
*/
var HarvesterRole = function() {};
HarvesterRole.prototype = Object.create(CreepRole.prototype);

HarvesterRole.harvestingCheck = function(creep) {
    if (creep.carry.energy == 0) {
        creep.memory.harvesting = true;
    } else if (creep.carry.energy == creep.carryCapacity) {
        creep.memory.harvesting = false;
    }
}

HarvesterRole.run = function(creep) {
    // First, determine if we are harvesting or
    // storing energy.
    HarvesterRole.harvestingCheck(creep);

    // If we are harvesting, we should just harvest from
    // nearest available source.
    if(creep.memory.harvesting) {
        creep.harvestFromNearestSource();
        return;
    }

    // If we are storing energy, determine all the places we can store.
    var allDepositableStructs = Utils.getAllDepositCapableStructures(creep.room);

    // Filter by priority order.
    var roomHasRunner = (creep.room.find(FIND_MY_CREEPS, {filter:(c) => {return c.memory.role == roleNames.RESOURCE_RUNNER}}).length > 0);
    var roomContainers = _.filter(allDepositableStructs, (s) => {return s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE;});
    // 1 Towers. They are our main defense, so need to be kept fueled.
    var targets = _.filter(allDepositableStructs, (s) => {return s.structureType == STRUCTURE_TOWER;});
    // 2 Spawns. They are necessary for keeping the creep population afloat.
    if (targets.length == 0 && (!roomHasRunner || roomContainers.length == 0)) targets = _.filter(allDepositableStructs, (s) => {return s.structureType == STRUCTURE_SPAWN;});
    // 3 Extensions. They are similar to spawns.
    if (targets.length == 0 && (!roomHasRunner || roomContainers.length == 0)) targets = _.filter(allDepositableStructs, (s) => {return s.structureType == STRUCTURE_EXTENSION;});
    // 4 Containers and storage. If everything else is fully fueled, we just store the energy.
    if (targets.length == 0) targets = roomContainers;

    // Finally, deposit.
    creep.depositToNearestStructure(targets);
}