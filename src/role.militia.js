

var roleMilitia = {
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