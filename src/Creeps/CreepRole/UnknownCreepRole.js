/**
* The role used when a creep has no assigned role.
* @class
* @extends CreepRole
*/
var UnknownCreepRole = function() {}
UnknownCreepRole.prototype = Object.create(CreepRole.prototype);

UnknownCreepRole.run = function(creep) {
	return;
}