/**
* The super class for all creep role logic classes.
* @class
*/
var CreepRole = function() {}

/**
* Returns the class object for the role assigned to the creep.
* This must be updated to add new creep roles.
* @param creep {Creep} The creep to find the role for.
* @returns {Class} The creep's role.
*/
CreepRole.findClass = function(creep) {
	switch(creep.memory.role) {
		case roleNames.HARVESTER:
			return HarvesterRole;
		case roleNames.BUILDER:
			return BuilderRole;
		case roleNames.MILITIA:
			return MilitiaRole;
		case roleNames.COLONIST_WORKER:
			return ColonistWorkerRole;
		case roleNames.COLONIST_TRADER:
			return ColonistTraderRole;
		case roleNames.UPGRADER:
			return UpgraderRole;
		default:
			return UnknownCreepRole;
	}
}

/**
* Finds the role for the creep and calls the run() function for it.
* @param creep {Creep} The creep to run.
*/
CreepRole.findRoleAndRun = function(creep) {
	var RoleClass = CreepRole.findRole(creep);
	RoleClass.run(creep);
}

/**
* The function that runs the main logic of the role class. Takes the
* creep to run as an argument.
* @function CreepRole.run
* @param creep {Creep} The creep to run.
* @abstract
*/