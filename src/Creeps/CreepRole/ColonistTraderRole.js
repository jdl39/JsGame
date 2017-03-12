/**
* Role for colonist that transports energy. Unable to do any work, but instead transport
* all energy harvested by the colony back to the home spawn.
* @class
* @extends ColonistRole
*/
var ColonistTraderRole = function() {};
ColonistTraderRole.prototype = Object.create(ColonistRole);

ColonistTraderRole.fetchingCheck = function(creep) {
    if (!creep.memory.fetching && _.sum(creep.carry) == 0) creep.memory.fetching = true;
    if (creep.memory.fetching && _.sum(creep.carry) == creep.carryCapacity) creep.memory.fetching = false;
}

ColonistTraderRole.run = function(creep) {
    var homeSpawn = Game.getObjectById(creep.memory.home);
    if (!homeSpawn) return;
    
    var colonyDirection = creep.memory.colonyDirection;
    if (typeof colonyDirection == "undefined") return;

    ColonistTraderRole.fetchingCheck(creep);

    // First, if we are home and need to fetch, we need to head out for the colony.
    if (creep.memory.fetching && ColonistRole.inHomeRoom(creep)) {
        ColonistRole.goToColony(creep);
        return;
    }

    if (creep.memory.fetching) {
        creep.withdrawFromNearestContainer();
        return;
    }
        
    if (!creep.memory.fetching) {
        if (ColonistRole.inHomeRoom(creep)) creep.depositToNearestContainer();
        else creep.moveTo(homeSpawn);
    }
}