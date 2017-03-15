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
* Actions to be performed at the beginning of a tick.
*/
 Creep.prototype.onTick = function() {
    this.memory.intention = null;
    
    // Doesn't work with movement...
    //this.room.visual.circle(this.pos, {fill: this.roleColor()});
 }
 
 /**
 * Performs a harvest, withdraw, or pickup on the target, depending on its type.
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

/**
* Instructs the creep to move to and harvest/withdraw from the target. CPU is cheaper
* than harvest from nearest source, if we already have a source in mind.
* @param target {Source|Resource|Structure} The target of the harvest/withdraw from.
*/
Creep.prototype.goToAndHarvestOrWithdrawEnergy = function(target) {
	if (this.harvestOrWithdrawEnergy(target) == ERR_NOT_IN_RANGE) this.moveTo(target);
}
 
 /** 
 * Searches for nearest source or dropped resource and attempts to harvest from
 * it.
 * @returns {Source|Resource} The source or dropped resource to harvest from.
 */
Creep.prototype.harvestFromNearestSource = function() {
	return this.harvestOrWithdrawFromNearestSource((s) => {
		return (s instanceof Source || s instanceof Resource);
	});
}

/**
* Searches for the nearest source, spawn (with unreserved energy), container, storage, or dropped energy to
* gather energy from, and attempts to gather it. NOTE: Only works with RESOURCE_ENERGY so far.
* @param [filterFunction] {filterFunction} A filter on the possible energy targets.
* @param [resourceType=RESOURCE_ENERGY] One of the RESOURCE_* constants. The resource to harvest/withdraw. Currently only RESOURCE_ENERGY is supported.
* @returns {RoomObject} The object we are gathering from.
* @cpu HIGH TODO: Consider possible caching solutions.
*/
Creep.prototype.harvestOrWithdrawFromNearestSource = function(filterFunction, resourceType) {
	if (typeof resourceType === "undefined") resourceType = RESOURCE_ENERGY;
	if (resourceType != RESOURCE_ENERGY) throw new Error("Creep.harvestOrWithdrawFromNearestSource: Resource type not supported: " + resourceType);

    var sources = this.room.find(FIND_SOURCES, {filter: (s) => {return s.energy > 0;}});
    var spawns = this.room.find(FIND_MY_SPAWNS);
    var containers = this.room.find(FIND_STRUCTURES, {filter: (s) => {return (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) && s.store[resourceType] > 0; }});
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

    if (filterFunction) energyTargets = _.filter(energyTargets, filterFunction);

    var intentableTargets = Utils.filterByIntent(energyTargets);
    
    var target = this.pos.findClosestByPath(intentableTargets, {ignoreCreeps:true});
    if (!target) target = this.pos.findClosestByPath(energyTargets, {ignoreCreeps:true});
    
    if (target && this.harvestOrWithdrawEnergy(target) == ERR_NOT_IN_RANGE) {
        this.moveTo(target);
    }

    return target;
}

/**
* Instructs the creep to mine the mineral in the room, if any.
*/
Creep.prototype.mineRoomMineral = function() {
	var roomMineral = this.room.find(FIND_MINERALS)[0];
	if (roomMineral && this.harvest(roomMineral) == ERR_NOT_IN_RANGE) this.moveTo(roomMineral); 
}

/**
* Instructs the creep to attack the nearest enemy creep.
* @param [filter] {filterFunction} A filter to apply to creep targeting.
* @returns {?Creep} The target, if any. Null otherwise.
*/
Creep.prototype.attackNearestEnemyCreep = function(filter) {
	var targets = creep.room.find(FIND_HOSTILE_CREEPS, {filter:filter});
    var target = creep.pos.findClosestByPath(targets, {ignoreCreeps:true});
        
    if (target) {
        if (creep.attack(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
    }
    return target;
}

/**
* Instructs the creep to upgrade the controller in its room.
*/
Creep.prototype.upgradeNearestController = function() {
	if(this.upgradeController(this.room.controller) == ERR_NOT_IN_RANGE) {
        this.moveTo(this.room.controller, {reusePath: 8});
    }
}

/**
* Instructs the creep to claim the controller in its room.
*/
Creep.prototype.claimNearestController = function() {
	if (this.claimController(this.room.controller) == ERR_NOT_IN_RANGE) {
		this.moveTo(this.room.controller, {reusePath: 8});
	}
}

/**
* Instructs the creep to desposit into the nearest structure capable of receiving the deposit.
* @param [filterOrTargets] {Array<Structure>|filterFunction} If this is an array, its structures are targeted instead of computing targets.
* If it is a filter function, it is used to filter targets. Note that targets incapable of receiving the deposit are already filtered out.
* @param [resourceType=RESOURCE_ENERGY] One of the RESOURCE_* constants. The resource type to deposit.
* @returns {?Structure} The structure we are attempting to deposit into/move to. Null if no target found.
*/
Creep.prototype.depositToNearestStructure = function(filterOrTargets, resourceType) {
 	if (typeof resourceType === "undefined") resourceType = RESOURCE_ENERGY;

 	var targets = null;
 	if (Array.isArray(filterOrTargets)) targets = filterOrTargets;
 	else targets = Utils.getAllDepositCapableStructures(this.room, resourceType, filterOrTargets);

 	var closest = this.pos.findClosestByPath(targets, {ignoreCreeps:true});
 	if (!closest) return null;
 	if (this.transfer(closest, resourceType) == ERR_NOT_IN_RANGE) this.moveTo(closest, {ignoreCreeps:true});
 	return closest;
}
 
/**
* Instructs the creep to deposit into the nearest container or storage capable of receiving the deposit.
* @param [resourceType=RESOURCE_ENERGY] One of the RESOURCE_* constants. The resource type to deposit.
* @returns {?Structure} The structure we are attempting to deposit into/move to. Null if no target found.
*/
Creep.prototype.depositToNearestContainer = function(resourceType) {
 	return this.depositToNearestStructure((s) => {return (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE)}, resourceType);
}
 
 /**
 * Instructs the creep to withdraw from the nearest container or storage (or dropped energy).
 * @returns {Structure|Resource} The object to withdraw from.
 */
Creep.prototype.withdrawFromNearestContainer = function() {
 	return this.harvestOrWithdrawFromNearestSource((s) => {
 		return (s instanceof Structure && (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE)) ||
 				(s instanceof Resource);
 	});
}

/**
* Instructs the creep to build the nearest construction site.
* @param [siteFilter] {filterFunction} A filter to apply to the construction sites.
* @returns {ConstructionSite} The site to build.
*/
Creep.prototype.buildNearestSite = function(siteFilter) {
    var targets = this.room.find(FIND_CONSTRUCTION_SITES, {filter: siteFilter});
    var target = this.pos.findClosestByPath(targets, {ignoreCreeps: true});
    if(target != null) {
        if(this.build(target) == ERR_NOT_IN_RANGE) {
            this.moveTo(target);
        }
    }
    
    return target;
}

/**
* Gets the amount of ticks it will take for the creep to traverse the given position.
* @param pos {RoomPosition} The position to calculate.
* @returns {number} The number of ticks it will take for the creep to pass through.
*/
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

/**
* Gets the number of ticks until the creep reaches its destination. It is only an estimate, as
* many variables can change.
* @returns {number} The number of ticks until the destination.
*/
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

	// This is cached to prevent recalculation in a single tick.
	this.memory.timeToDestTimestamp = Game.time;
	this.memory.timeToDest = totalCost;
	return totalCost;
}
 
Creep.prototype.soundOff = function(infoType) {
    if (infoType == "role") {
        this.say(this.memory.role);
    }
}

/**
* Gets an array of the raw body parts that make up the creep.
* Eg [WORK, CARRY, MOVE]
* @returns {Array<BodypartType>} The raw bodyparts of the creep.
*/
Creep.prototype.rawBody = function() {
    var rb = [];
    for (var i in this.body) {
        rb.push(this.body[i].type);
    }
    return rb;
}

/**
* Gets the move power of the creep. This is the amount of fatigue
* the creep can deal with per tick.
* @returns {number} The amount of fatigue the creep can deal with per tick.
*/
Creep.prototype.movePower = function() {
 	var p = 0;
 	for (var i in this.body) {
 		if (this.body[i].type == MOVE) {
 			p += 2;
 		}
 	}
 	return p;
}

/**
* Retrieves the color associated with the creep's role. Used for move paths.
* @returns {string} String representation of the creep's role color.
*/
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
 
/**
* Instructs the creep to perform an unowned structure repair check on its room, if needed.
* Marks unowned structures in need of repair.
* @param [force] {boolean} If true, the function bypasses the repair check counter.
*/
Creep.prototype.checkUnownedStructureRepair = function(force) {
 	if (!force && !Memphis.roomNeedsRepairCheck(this.room)) return;
 	var structuresToRepair = this.room.find(FIND_STRUCTURES, {filter: (s) => {
        return ((s.structureType == STRUCTURE_ROAD || s.structureType == STRUCTURE_CONTAINER) && s.hits <= s.hitsMax * structureConstants.UNOWNED_STRUCTURE_REPAIR_LIMIT) ||
        		((s.structureType == STRUCTURE_WALL) && s.hits <= structureConstants.WALL_HITS_PER_LEVEL * this.room.controller.level * structureConstants.UNOWNED_STRUCTURE_REPAIR_LIMIT); 
    }});
    for (var i in structuresToRepair) {
    	Memphis.markForRepair(structuresToRepair[i]);
    }
    Memphis.markRoomRepairCheckCompleted(this.room);
}

/**
* Instructs the creep to repair the nearest structure in need of repair.
* @param [filter] {filterFunction} An optional filter to apply to the structures in need of repair.
* @return {?Structure} The structure we are attempting to repair, or null, if none was found.
*/
Creep.prototype.repairNearestStructureNeedingRepair = function(filter) {
    var structuresInNeedOfRepair = Memphis.getStructuresThatNeedRepair(filter);
    
    var structureToRepair = this.pos.findClosestByPath(structuresInNeedOfRepair);
    if (structureToRepair && this.repair(structureToRepair) == ERR_NOT_IN_RANGE) this.moveTo(structureToRepair);
    return structureToRepair;
}