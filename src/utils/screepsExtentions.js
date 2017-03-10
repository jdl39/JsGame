/**
* Game RoomObject class
* @class RoomObject
*/

/**
* Determines if a new creep may place intent on this object.
* @function RoomObject#intentAllowed
* @abstract
* @returns {boolean} True if a new creep may place intent.
*/
 
 // Spawn extentions ---------------------------------------------
 StructureSpawn.prototype.energyCapacityIncludingExtentions = function() {
     var extentions = this.room.find(FIND_MY_STRUCTURES, {filter: function(structure) { return structure.structureType === STRUCTURE_EXTENSION; }});
     var eCap = this.energyCapacity;
     for (var i in extentions) {
         var extention = extentions[i];
         eCap += extention.energyCapacity;
     }
     return eCap;
 }
 
  StructureSpawn.prototype.energyIncludingExtentions = function() {
     var extentions = this.room.find(FIND_MY_STRUCTURES, {filter: function(structure) { return structure.structureType === STRUCTURE_EXTENSION; }});
     var e = this.energy;
     for (var i in extentions) {
         var extention = extentions[i];
         e += extention.energy;
     }
     return e;
 }
 // --------------------------------------------------------------
 
 // Room extentions ----------------------------------------------
 Room.prototype.soundOffRoles = function() {
     var myCreeps = this.find(FIND_MY_CREEPS);
     for (var name in myCreeps) {
         var c = myCreeps[name];
         c.soundOff("role");
     }
 }
 // --------------------------------------------------------------

 // Resource extentions ------------------------------------------
 Resource.prototype.intentAllowed = function() {
    var creepsIntent = Utils.creepsIntentOn(target);
    var amountUnclaimed = this.amount;
    for (var i in creepsIntent) {
        var creep = creepsIntent[i];
        amountUnclaimed -= creep.carryCapacity - _.sum(creep.carry);
    }
    return amountUnclaimed > 0;
 }
 // --------------------------------------------------------------
 
 // Game extentions ----------------------------------------------
 Game.stats = function() {
    var creepRoleCount = {};
    var creepValues = {};
    
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (!creepRoleCount[creep.memory.role]) {
            creepRoleCount[creep.memory.role] = 0;
        }
        creepRoleCount[creep.memory.role] += 1;
        
        var creepValue = Utils.bodyCost(creep.rawBody());
        if (!creepValues[creepValue]) {
            creepValues[creepValue] = 0;
        }
        creepValues[creepValue] += 1;
    }
    
    // Roles.
    console.log("Creep Role Count:\n");
    for (var role in creepRoleCount) {
        console.log("    " + role + ": " + creepRoleCount[role]);
    }
    
    // Values.
    console.log("\nCreep Value Count:\n");
    var sortedValues = Utils.sortObjectByProperties(creepValues);
    for (var i in sortedValues) {
        var pair = sortedValues[i];
        console.log("    " + pair[0] + ": " + pair[1]);
    }
 }
 // --------------------------------------------------------------

 // Controller extentions ----------------------------------------
 StructureController.prototype.numAllowedExtentions = function() {
    switch(this.level) {
        case 0:
            return 0;
        case 1:
            return 0;
        case 2:
            return 5;
        case 3:
            return 10;
        case 4:
            return 20;
        case 5:
            return 30;
        case 6:
            return 40;
        case 7:
            return 50;
        case 8:
            return 60;
        default:
            return 0;
    }
 }
 
 StructureController.prototype.numAllowedTowers = function() {
     switch(this.level) {
        case 1:
        case 2:
            return 0;
        case 3:
        case 4:
            return 1;
        case 5:
        case 6:
            return 2;
        case 7:
            return 3;
        case 8:
            return 6;
     }
 }
 // --------------------------------------------------------------

module.exports.stats = Game.stats;