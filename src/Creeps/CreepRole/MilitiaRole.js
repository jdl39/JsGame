/**
* This role is responsible for guarding owned rooms against attack.
* This has been largely replaced by towers, but can be useful in
* low-level rooms.
* @class
* @extends CreepRole
*/
var MilitiaRole = function() {};
MilitiaRole.prototype = Object.create(CreepRole.prototype);

MilitiaRole.run = function(creep) {
	creep.attackNearestEnemyCreep();
}