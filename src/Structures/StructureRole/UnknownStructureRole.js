/**
* The role used when a structure has no assigned role.
* @class
* @extends StructureRole
*/
var UnknownStructureRole = function() {}
UnknownStructureRole.prototype = Object.create(StructureRole.prototype);

UnknownStructureRole.run = function(structure) {
	return;
}