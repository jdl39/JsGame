/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role.militia');
 * mod.thing == 'a thing'; // true
 */
 
 var utils = require("utilities");

module.exports = {
    run: function(creep) {
        var targets = creep.room.find(FIND_HOSTILE_CREEPS);
        var target = utils.findClosest(creep.pos, targets);
        
        if (target) {
    	    if (creep.attack(target) == ERR_NOT_IN_RANGE) {
    	        creep.moveTo(target);
    	    }
    	}
    }
};