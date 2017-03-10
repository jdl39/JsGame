/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role.colonistTrader');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    run: function(creep) {
        var homeSpawn = Game.getObjectById(creep.memory.home);
        if (!homeSpawn) return;
        var homeRoom = homeSpawn.room;
        
        var colonyDirection = creep.memory.colonyDirection;
        if (typeof colonyDirection == "undefined") return;
        
        if (!creep.memory.fetching && _.sum(creep.carry) == 0) creep.memory.fetching = true;
        if (creep.memory.fetching && _.sum(creep.carry) == creep.carryCapacity) creep.memory.fetching = false;
        
        // First, if we are home and need to harvest, we need to head out for the colony.
        if (creep.memory.fetching && creep.room.name === homeRoom.name) {
            var exit = null;
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
            }
            
            if (exit !== null) {
                if (exit === creep.pos) creep.move(colonyDirection);
                else creep.moveTo(exit);
            }
            return;
        }
        
        if (creep.memory.fetching) {
            creep.withdrawFromNearestContainer();
            return;
        }
        
        if (!creep.memory.fetching) {
            if (creep.room.name == homeSpawn.room.name) creep.depositToNearestContainer();
            else creep.moveTo(homeSpawn);
        }
    }
};