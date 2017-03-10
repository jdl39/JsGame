var roleNames = require("constants.roleNames");

// Each role is an array of bodies from strongest/most expensive to weakest/least expensive.
// Ideally each level should match the largest possible cost for a controller level.
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

module.exports = creepBodies;