/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('towerRole.default');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    run: function(tower) {
        // First, kill enemies.
        var enemies = tower.room.find(FIND_HOSTILE_CREEPS);
        if (enemies.length) {
            tower.attack(tower.pos.findClosestByRange(enemies));
            return;
        }
        
        // Next, heal allies.
        var wounded = tower.room.find(FIND_MY_CREEPS, {filter: (c) => {return c.hits < c.hitsMax;}});
        if (wounded.length) {
            tower.heal(tower.pos.findClosestByRange(wounded));
            return;
        }
        
        // Finally, repair.
        var damagedStructures = tower.room.find(FIND_STRUCTURES, {filter: (s) => {
            if (s.structureType == STRUCTURE_WALL) return s.hits < 1000;
            if (typeof s.ticksToDecay !== "undefined") return Memory.needsRepair[s.id];
            return s.hits < s.hitsMax;
        }});
        if (damagedStructures.length) {
            tower.repair(tower.pos.findClosestByRange(damagedStructures));
            return;
        }
    }
};