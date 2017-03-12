/**
* This creep role is responsible for upgrading the controller in its room.
* It has less logic than a builder, but is important to ensure that the
* controller's downgrade timer stays at bay.
* @class
* @extends CreepRole
*/
var UpgraderRole = function() {};
UpgraderRole.prototype = Object.create(CreepRole.prototype);

UpgraderRole.upgradingCheck = function(creep) {
    if(creep.memory.upgrading && creep.carry.energy == 0) {
        creep.memory.upgrading = false;
    }
    if(!creep.memory.upgrading && creep.carry.energy == creep.carryCapacity) {
        creep.memory.upgrading = true;
    }
}

UpgraderRole.run = function(creep) {
    UpgraderRole.upgradingCheck(creep);

    if (creep.memory.upgrading) creep.upgradeNearestController();
    else creep.harvestOrWithdrawFromNearestSource();
}