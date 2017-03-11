// Constants

/**
* Names for each role.
* @namespace
*/
var roleNames = {
    /** @constant {string} */
    HARVESTER: "harvester",
    /** @constant {string} */
    UPGRADER: "upgrader",
    /** @constant {string} */
    BUILDER: "builder",
    /** @constant {string} */
    MILITIA: "militia",
    /** @constant {string} */
    COLONIST_WORKER: "colonist.worker",
    /** @constant {string} */
    COLONIST_TRADER: "colonist.trader",
    
    /** @constant {string} */
    SPAWN_DEFAULT: "default",
    
    /** @constant {string} */
    TOWER_DEFAULT: "default",
};

/**
* Each role is an array of bodies from strongest/most expensive to weakest/least expensive.
* Ideally each level should match the largest possible cost for a controller level.
* @namespace
*/
var creepBodies = {};

creepBodies[roleNames.HARVESTER] = [
    [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
    [WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
    [WORK, CARRY, MOVE]];
creepBodies[roleNames.BUILDER] = [
    [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
    [WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
    [WORK, CARRY, MOVE]];
creepBodies[roleNames.UPGRADER] = [
    [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
    [WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
    [WORK, CARRY, MOVE]];
    
creepBodies[roleNames.COLONIST_WORKER] = [
    [WORK, WORK, CARRY, CARRY, MOVE, MOVE]];
creepBodies[roleNames.COLONIST_TRADER] = [
    [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE]];
    
creepBodies[roleNames.MILITIA] = [
    [ATTACK, ATTACK, ATTACK, MOVE, MOVE, MOVE],
    [ATTACK, MOVE]];

/**
* Constants pertaining to structures.
* @namespace
*/
var structureConstants = {
    /** @constant {number} */
    OWNED_STRUCTURE_REPAIR_LIMIT: 0.75,
    
    /** @constant {number} */
    ROAD_REPAIR_LIMIT: 0.5,
    /** @constant {number} */
    ROAD_REPAIR_COUNTER: 500,

    /** 
    * Constants used for finding an optimal tower site.
    * @constant {Object}
    */
    towerSiteCostConstants: {
        COST_FOR_OFF_CENTER: 1,
        COST_FOR_OFF_SPAWN: 5,
        COST_FOR_OFF_OTHER_TOWER: -4,
    }
};

/**
* Constants for colors associated with roles.
* @namespace
*/
var visualConstants = {
    /** @constant {string} */
    HARVESTER_COLOR: '#ffaa00',
    /** @constant {string} */
    BUILDER_COLOR: '#ffff00',
    /** @constant {string} */
    UPGRADER_COLOR: '#00ffff',
    /** @constant {string} */
    COLONIST_WORKER_COLOR: '#22ffaa',
    /** @constant {string} */
    DEFAULT_PATH: '#000000',
};