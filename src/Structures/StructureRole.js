/**
* The super class for all structure role logic classes.
* @class
*/
var StructureRole = function() {}

/**
* Returns the class object for the role assigned to the structure.
* This must be updated to add new structure roles.
* @param structure {Structure} The structure to find the role for.
* @returns {Class} The structure's role.
*/
StructureRole.findRole = function(structure) {
	var RoleClass = UnknownStructureRole;
	switch (structure.structureType) {
		case STRUCTURE_SPAWN:
			RoleClass = SpawnRole;
			break;
		case STRUCTURE_TOWER:
			RoleClass = TowerRole;
			break;
	}

	return RoleClass;
}

/**
* Finds the role for the structure and calls the run() function for it.
* @param structure {Structure} The structure to run.
*/
StructureRole.findRoleAndRun = function(structure) {
	var RoleClass = StructureRole.findRole(structure);
	RoleClass.run(structure);
}

/**
* The function that runs the main logic of the role class. Takes the
* structure to run as an argument.
* @function StructureRole.run
* @param structure {Structure} The structure to run.
* @abstract
*/