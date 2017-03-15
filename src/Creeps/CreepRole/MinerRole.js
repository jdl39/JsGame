/**
* This creep role is responsible for Mining minerals in its room.
* @class
* @extends CreepRole
*/
var MinerRole = function() {};
MinerRole.prototype = Object.create(CreepRole.prototype);

MinerRole.miningCheck = function(creep) {
    if (_sum(creep.carry) == 0) {
        creep.memory.mining = true;
    } else if (_sum(creep.carry) == creep.carryCapacity) {
        creep.memory.mining = false;
    }
}

MinerRole.run = function(creep) {
	MinerRole.miningCheck(creep);
	if (creep.memory.mining) {
		creep.mineRoomMineral();
	} else {
		creep.depositToNearestContainer(Object.keys(creep.carry)[0]);
	}
}