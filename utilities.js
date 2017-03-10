/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('utilities');
 * mod.thing == 'a thing'; // true
 */
 
var structureConstants = require('constants.structures');

var BODY_PART_COSTS = {};
BODY_PART_COSTS[MOVE] = 50;
BODY_PART_COSTS[WORK] = 100;
BODY_PART_COSTS[CARRY] = 50;
BODY_PART_COSTS[ATTACK] = 80;
BODY_PART_COSTS[RANGED_ATTACK] = 150;
BODY_PART_COSTS[HEAL] = 250;
BODY_PART_COSTS[CLAIM] = 600;
BODY_PART_COSTS[TOUGH] = 10;

var _calcAllowedIntent = function(target) {
    var allowed = 0;
    var targetX = target.pos.x;
    var targetY = target.pos.y;
    for (var x = targetX - 1; x <= targetX + 1; x += 1) {
        if (x < 0 || x >= 50) continue;
        for (var y = targetY - 1; y <= targetY + 1; y += 1) {
            if (y < 0 || y >= 50) continue;
            var blocker = false;
            var objects = new RoomPosition(x, y, target.room.name).look();
            for (var i in objects) {
                var object = objects[i];
                if (object.type === "structure" && object.structure.structureType !== STRUCTURE_ROAD) {
                    blocker = true;
                }
                if (object.type === "terrain" && object.terrain === "wall") {
                    blocker = true;
                }
            }
            if (!blocker) {
                allowed += 1;
            }
        }
    }
    Memory.allowedIntent[target.id] = allowed;
}

var _allowedIntent = function(target) {
    if (typeof Memory.allowedIntent === "undefined") {
        Memory.allowedIntent = {};
    }
    
    if (typeof Memory.allowedIntent[target.id] === "undefined") {
        _calcAllowedIntent(target);
    }
    
    return Memory.allowedIntent[target.id];
}

var _creepsIntentOn = function(target) {
    var creeps = [];
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.memory.intention === target.id) {
            creeps.push(creep);
        }
    }
    
    return creeps;
}

var _filterByIntent = function(targets) {
    return _.filter(targets, function(target) {
        var creepsIntent = _creepsIntentOn(target);
        
        if (target instanceof Resource) {
            var amountUnclaimed = target.amount;
            for (var i in creepsIntent) {
                var creep = creepsIntent[i];
                amountUnclaimed -= creep.carryCapacity - _.sum(creep.carry, function(obj) {return obj.amount});
            }
            return amountUnclaimed > 0;
        }
        
        return _allowedIntent(target) > creepsIntent.length;
    });
}

var _sortObjectByProperties = function(object) {
    var sortable = [];
    for (var prop in object) {
        sortable.push([prop, object[prop]]);
    }
    sortable.sort(function(a, b) {return a[0] - b[0]});
    return sortable;
}

var _pathContainsPos = function(path, pos) {
    for (var i in path) {
        if (path[i].x == pos.x && path[i].y == pos.y) return true;
    }
    return false;
}

var _markForRepair = function(structure) {
    if (typeof Memory.needsRepair === "undefined") Memory.needsRepair = {};
    Memory.needsReair[structure.id] = true;
}

// Things that should happen every tick, globally
var _repairUpdate = function() {
    if (Memory.roomToRoadCheckCounter) {
        for (var roomName in Memory.roomToRoadCheckCounter) {
            Memory.roomToRoadCheckCounter[roomName] -= 1;
            if (Memory.roomToRoadCheckCounter[roomName] <= 0) delete Memory.roomToRoadCheckCounter[roomName];
        }
    }
    
    if (typeof Memory.needsRepair === "undefined") Memory.needsRepair = {};
    for (var id in Memory.needsRepair) {
        var object = Game.getObjectById(id);
        if (!object ||
            !(object instanceof Structure) ||
            object.hits == object.maxHits) {
            delete Memory.needsRepair[id];
        }
    }
    
    for (var id in Game.structures) {
        var structure = Game.structures[id];
        if (structure.hits * 1.0 / structure.hitsMax <= structureConstants.OWNED_STRUCTURE_REPAIR_LIMIT) {
            Memory.needsRepair[id] = true;
        }
    }
}
var _onTick = function() {
    _repairUpdate();
}

module.exports = {
    findClosest: function(pos, objects) {
        var close = pos.findClosestByPath(objects, {ignoreCreeps:true});
        if (close == null) {
            close = pos.findClosestByRange(objects);
        }
        return close;
    },
    
    bodyCost: function(body) {
        var cost = 0;
        for (var i in body) {
            var part = body[i];
            cost += BODY_PART_COSTS[part]
        }
        return cost;
    },
    
    creepsIntentOn: _creepsIntentOn,
    
    allowedIntent: _allowedIntent,
    
    recalcAllowedIntent: _calcAllowedIntent,
    
    filterByIntent: _filterByIntent,
    
    sortObjectByProperties: _sortObjectByProperties,

    pathContainsPos: _pathContainsPos,
    markForRepair: _markForRepair,
    onTick: _onTick,
};