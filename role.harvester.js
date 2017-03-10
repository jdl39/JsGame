var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if (creep.carry.energy == 0) {
            creep.memory.harvesting = true;
        } else if (creep.carry.energy == creep.carryCapacity) {
            creep.memory.harvesting = false;
        }

	    if(creep.memory.harvesting) {
            creep.harvestFromNearestSource();
        }
        else {
            var allDepositableStructs = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return ((structure.structureType == STRUCTURE_EXTENSION ||
                                structure.structureType == STRUCTURE_SPAWN ||
                                structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity) ||
                                ((structure.structureType == STRUCTURE_CONTAINER ||
                                structure.structureType == STRUCTURE_STORAGE) && _.sum(structure.store) < structure.storeCapacity);
                    }
            });
            
            var targets = _.filter(allDepositableStructs, (s) => {return s.structureType == STRUCTURE_TOWER;});
            if(targets.length == 0) {
                targets = _.filter(allDepositableStructs, (s) => {return s.structureType == STRUCTURE_SPAWN;});
            }
            if (targets.length == 0) {
                targets = _.filter(allDepositableStructs, (s) => {return s.structureType == STRUCTURE_EXTENSION;});
            }
            if (targets.length == 0) {
                targets = _.filter(allDepositableStructs, (s) => {return s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE;});
            }
            if(targets.length > 0) {
                if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {reusePath: 8, visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        }
	}
};

module.exports = roleHarvester;