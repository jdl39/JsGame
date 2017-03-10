// Module: extentions.creep
// This module contains extentions to the base behavior of the Creep class. It overwrites
// most of the default methods to extend them with additional behavior and adds new
// functions for convenience.

/**
* The creep built-in class.
* @class Creep
*/

// ------------------------------------------------------
// Method overrides
// ------------------------------------------------------
// attack
var attackOld = Creep.prototype.attack;
Creep.prototype.attack = function(target) {
	this.memory.intention = target.id;
	return attackOld.apply(this, [target]);
}

// TODO: attackController

// build
var buildOld = Creep.prototype.build;
Creep.prototype.build = function(target) {
	this.memory.intention = target.id;
	return buildOld.apply(this, [target]);
}

// TODO: cancelOrder
// TODO: claimController
// TODO: dismantle
// TODO: drop
// TODO: generateSafeMode
// TODO: getActiveBodyParts?

// harvest
var harvestOld = Creep.prototype.harvest;
Creep.prototype.harvest = function(target) {
	this.memory.intention = target.id;
	return harvestOld.apply(this, [target]);
}

// TODO: heal

// move
var moveOld = Creep.prototype.move;
Creep.prototype.move = function(direction) {
	return moveOld.apply(this, [direction]);
}

// TODO: moveByPath

// moveTo
var moveToOld = Creep.prototype.moveTo;
Creep.prototype.moveTo = function(arg1, arg2, arg3) {
	if (arg1 instanceof RoomObject) {
		this.memory.intention = arg1.id;
	}
	var useArg2 = true;
	if (typeof arg2 === "number") {
		useArg2 = false;
	}
	if (useArg2 && !arg2) {
		arg2 = {};
	} else if (!useArg2 && !arg3) {
		arg3 == {};
	}

	if (useArg2) {
		arg2.visualizePathStyle = {stroke: this.roleColor()};
	} else {
		arg3.visualizePathStyle = {stroke: this.roleColor()};
	}
	return moveToOld.apply(this, [arg1, arg2, arg3]);
}

// TODO: notifyWhenAttacked

// pickup
var pickupOld = Creep.prototype.pickup;
Creep.prototype.pickup = function(target) {
	this.memory.intention = target.id;
	return pickupOld.apply(this, [target]);
}

// TODO: rangedAttack
// TODO: rangedHeal
// TODO: rangedMassAttack

// repair
var repairOld = Creep.prototype.repair;
Creep.prototype.repair = function(target) {
	this.memory.intention = target.id;
	return repairOld.apply(this, [target]);
}

// TODO: reserveController
// TODO: say
// TODO: signController
// TODO: suicide

// transfer
var transferOld = Creep.prototype.transfer;
Creep.prototype.transfer = function(target, resourceType, amount) {
	this.memory.intention = target.id;
	return transferOld.apply(this, [target, resourceType, amount]);
}

// upgradeController
var upgradeControllerOld = Creep.prototype.upgradeController;
Creep.prototype.upgradeController = function(target) {
	this.memory.intention = target.id;
	return upgradeControllerOld.apply(this, [target]);
}

// withdraw
var withdrawOld = Creep.prototype.withdraw;
Creep.prototype.withdraw = function(target, resourceType, amount) {
	this.memory.intention = target.id;
	return withdrawOld.apply(this, [target, resourceType, amount]);
}

// ------------------------------------------------------
// New methods
// ------------------------------------------------------
/**
* Function called for every tick.
* @memberof Creep
*/
Creep.onTick = function() {
    if (typeof Memory.GlobalCreepMemory === "undefined") Memory.GlobalCreepMemory = {};
    Memory.GlobalCreepMemory.foundConstructionSitesForRoom = {};
}

/** Actions to be performed at the beginning of a tick.
* @memberof Creep
* @instance
*/
 Creep.prototype.onTick = function() {
    this.memory.intention = null;
    
    // Doesn't work with movement...
    //this.room.visual.circle(this.pos, {fill: this.roleColor()});
 }
 
 /** Performs a harvest or a transfer on the target, depending on its type.
 * @memberof Creep
 * @instance
 * @param target {Source | Resource | Structure} The target to harvest/withdraw from.
 */
 Creep.prototype.harvestOrWithdrawEnergy = function(target) {
 	if (target instanceof Resource) {
 		return this.pickup(target);
 	}

    if (target instanceof Source) {
        return this.harvest(target);
    }
     
    return this.withdraw(target, RESOURCE_ENERGY);
 }
 
 /** Searches for nearest source or dropped resource and attempts to harvest from
 * it.
 * @memberof Creep
 * @instance
 */
 Creep.prototype.harvestFromNearestSource = function() {
    var sources = this.room.find(FIND_SOURCES);
    sources = _.filter(sources, function(source) { return source.energy > 0;});
    
    var resourceDrops = this.room.find(FIND_DROPPED_ENERGY);
    
    var allSources = sources.concat(resourceDrops);
    allSources = utils.filterByIntent(allSources);
    
    var source = utils.findClosest(this.pos, allSources);
    if (!source) {
        source = utils.findClosest(this.pos, sources);
    }
    
    var err = OK;
    if (source) {
    	if(source instanceof Resource) {
    	    err = this.pickup(source);
    	} else {
    	    err = this.harvest(source);
    	}
	}
    if (err == ERR_NOT_IN_RANGE) {
        this.moveTo(source);
    }
    
    return source;
 }
 
 Creep.prototype.depositToNearestContainer = function() {
     var containers = this.room.find(FIND_STRUCTURES, {filter: (s) => {return (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE) && _.sum(s.store) < s.storeCapacity}});
     var closest = this.pos.findClosestByPath(containers, {ignoreCreeps:true});
     if (this.transfer(closest, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) this.moveTo(closest);
     return closest;
 }
 
 Creep.prototype.withdrawFromNearestContainer = function() {
     var containers = this.room.find(FIND_STRUCTURES, {filter: (s) => {return (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE) && s.store.energy > 0}});
     containers = containers.concat(this.room.find(FIND_DROPPED_ENERGY));
     var closest = this.pos.findClosestByPath(containers, {ignoreCreeps:true});
     if (closest && closest instanceof Structure && this.withdraw(closest, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) this.moveTo(closest);
     else if (closest && closest instanceof Resource && this.pickup(closest) == ERR_NOT_IN_RANGE) this.moveTo(closest);
     return closest;
 }
 
 Creep.prototype.harvestOrWithdrawFromNearestSource = function() {
    var sources = this.room.find(FIND_SOURCES, {filter: (s) => {return s.energy > 0;}});
    var spawns = this.room.find(FIND_MY_SPAWNS);
    var containers = this.room.find(FIND_STRUCTURES, {filter: (s) => {return s.structureType === STRUCTURE_CONTAINER && s.store.energy > 0; }});
    var resourceDrops = this.room.find(FIND_DROPPED_ENERGY);
    
    var theCreep = this;
    spawns = _.filter(spawns, function(spawn) {
        var energyNeeded = theCreep.carryCapacity;
        if (typeof spawn.memory.reservedEnergy !== "undefined") {
            energyNeeded += spawn.memory.reservedEnergy;
        }
        return spawn.energy >= energyNeeded;
    });
    
    var energyTargets = sources.concat(spawns);
    energyTargets = energyTargets.concat(containers);
    energyTargets = energyTargets.concat(resourceDrops);
    energyTargets = utils.filterByIntent(energyTargets);
    
    var target = utils.findClosest(this.pos, energyTargets);
    
    if (target && this.harvestOrWithdrawEnergy(target) == ERR_NOT_IN_RANGE) {
        this.moveTo(target);
    }
 }
 
 Creep.prototype.buildNearestSite = function(siteFilter) {
    var targets = this.room.find(FIND_CONSTRUCTION_SITES, {filter: siteFilter});
    var target = utils.findClosest(this.pos, targets);
    if(target != null) {
        if(this.build(target) == ERR_NOT_IN_RANGE) {
            this.moveTo(target);
        }
    }
    
    return target;
 }

Creep.prototype.posTickCost = function(pos) {
	var costPerPart = 999;
	var possibleRoad = pos.lookFor(LOOK_STRUCTURES);
	for (var i in possibleRoad) {
		if (possibleRoad[i].structureType === STRUCTURE_ROAD) {
			costPerPart = 1;
			break;
		}
	}

	if (costPerPart != 1) {
		var terrain = pos.lookFor(LOOK_TERRAIN);
		if (terrain.length) {
			var t = terrain[0];
			switch(t) {
				case 'swamp':
					costPerPart = 10;
					break;
				case 'plain':
					costPerPart = 2;
					break;
				case 'wall':
					// Sometimes this is included in paths to objects within walls.
					// It shouldn't be included in cost.
					return 0;
				default:
					break;
			}
		}
	}

	var cost = 0;
	var movePower = 0;
	cost += costPerPart * Math.ceil(_.sum(this.carry) * 1.0/50);
	for (var i in this.body) {
		var part = this.body[i];
		if (part.type == CARRY) {
			continue;
		}
		if (part.type == MOVE) {
			movePower += 2;
			continue;
		}
		cost += costPerPart;
	}

	return Math.ceil(cost * 1.0 / movePower);
}

Creep.prototype.timeToDest = function() {
	if (this.memory.timeToDestTimestamp === Game.time) {
		return this.memory.timeToDest;
	}

	var path = Room.deserializePath(this.memory._move.path);
	var totalCost = 0;
	for (var i in path) {
		if (i == 0) {
			var meCheck = this.room.getPositionAt(path[i].x, path[i].y).lookFor(LOOK_CREEPS);
			if (meCheck.length && meCheck[0].id == this.id) {
				continue;
			}
		}
		totalCost += this.posTickCost(this.room.getPositionAt(path[i].x, path[i].y));
	}

	totalCost += Math.ceil(this.fatigue * 1.0 / this.movePower());

	this.memory.timeToDestTimestamp = Game.time;
	this.memory.timeToDest = totalCost;
	return totalCost;
}
 
 Creep.prototype.soundOff = function(infoType) {
     if (infoType == "role") {
         this.say(this.memory.role);
     }
 }
 
 Creep.prototype.rawBody = function() {
     var rb = [];
     for (var i in this.body) {
         rb.push(this.body[i].type);
     }
     return rb;
 }

 Creep.prototype.movePower = function() {
 	var p = 0;
 	for (var i in this.body) {
 		if (this.body[i].type == MOVE) {
 			p += 2;
 		}
 	}
 	return p;
 }

 Creep.prototype.roleColor = function() {
 	switch (this.memory.role) {
 		case roleNames.HARVESTER:
 			return visualConstants.HARVESTER_COLOR;
 		case roleNames.UPGRADER:
 			return visualConstants.UPGRADER_COLOR;
 		case roleNames.BUILDER:
 			return visualConstants.BUILDER_COLOR;
 		case roleNames.COLONIST_WORKER:
 		    return visualConstants.COLONIST_WORKER_COLOR;
 		default:
 			return visualConstants.DEFAULT_COLOR;
 	}
 }
 
 Creep.prototype.checkRoadRepair = function() {
     if (typeof Memory.roomToRoadCheckCounter == "undefined") Memory.roomToRoadCheckCounter = {};
     if (typeof Memory.roomToRoadCheckCounter[this.room.name] === "undefined") Memory.roomToRoadCheckCounter[this.room.name] = 0;
     if (Memory.roomToRoadCheckCounter[this.room.name] > 0) return;
     var roadsToRepair = this.room.find(FIND_STRUCTURES, {filter: (s) => {
         return (s.structureType == STRUCTURE_ROAD || s.structureType == STRUCTURE_CONTAINER) && s.hits <= s.hitsMax * structureConstants.ROAD_REPAIR_LIMIT; 
     }});
     for (var i in roadsToRepair) {
         utils.markForRepair(roadsToRepair[i]);
     }
     Memory.roomToRoadCheckCounter[this.room.name] = structureConstants.ROAD_REPAIR_COUNTER;
 }
 
 Creep.prototype.repairNearestStructureNeedingRepair = function(filter) {
     var structuresInNeedOfRepair = [];
     for (var id in Memory.needsRepair) {
         var object = Game.getObjectById(id);
         if (object) structuresInNeedOfRepair.push(object);
     }
     
     if (filter) _.filter(structuresInNeedOfRepair, filter);
     var structureToRepair = this.pos.findClosestByPath(structuresInNeedOfRepair);
     if (structureToRepair && this.repair(structureToRepair) == ERR_NOT_IN_RANGE) this.moveTo(structureToRepair);
     return structureToRepair;
 }