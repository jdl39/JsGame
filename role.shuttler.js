/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role.shuttler');
 * mod.thing == 'a thing'; // true
 */

 var utils = require("utilities");

var pickPickupTarget = function(creep) {
	var containers = creep.room.find(FIND_MY_STRUCTURES, {filter: (s) => {return s.type == STRUCTURE_CONTAINER && s.store.energy > 0}});

	return utils.findClosest(creep.pos, containers);
}

module.exports = {
    run: function(creep) {
        // First, pick up resource to shuttle.
        if (creep.carry.energy < creep.carryCapacity) {
        	var target = pickPickupTarget(creep);
        	if ()
        }
    }
};