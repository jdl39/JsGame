

var roleMilitia = {
    run: function(creep) {
        var targets = creep.room.find(FIND_HOSTILE_CREEPS);
        var target = creep.pos.findClosestByPath(targets, {ignoreCreeps:true});
        
        if (target) {
    	    if (creep.attack(target) == ERR_NOT_IN_RANGE) {
    	        creep.moveTo(target);
    	    }
    	}
    }
};