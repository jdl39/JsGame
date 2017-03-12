/**
* Superclass for all colonist roles. A colonist is a creep who works in a room
* adjacent to the room it was spawned in.
* @class
* @extends CreepRole
*/
var ColonistRole = function() {};
ColonistRole.prototype = Object.create(CreepRole.prototype);

ColonistRole.inHomeRoom = function(creep) {
	return creep.room.name === Game.getObjectById(creep.memory.home).room.name;
}

ColonistRole.goToColony = function(creep) {
	var exit = null;
	var colonyDirection = creep.memory.colonyDirection;
    switch(colonyDirection) {
        case BOTTOM:
            exit = creep.pos.findClosestByPath(FIND_EXIT_BOTTOM);
            break;
        case TOP:
            exit = creep.pos.findClosestByPath(FIND_EXIT_TOP);
            break;
        case LEFT:
            exit = creep.pos.findClosestByPath(FIND_EXIT_LEFT);
            break;
        case RIGHT:
            exit = creep.pos.findClosestByPath(FIND_EXIT_RIGHT);
            break;
        default:
        	throw new Error("ColonistRole.goToColony: Unknown colony direction " + colonyDirection);
    }
            
    if (exit !== null) {
        if (exit === creep.pos) creep.move(colonyDirection);
        else creep.moveTo(exit);
    }
}