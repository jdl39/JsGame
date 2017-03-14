/**
* The default role for towers.
* @class
* @extends StructureRole
*/
var TowerRole = function() {};
TowerRole.prototype = Object.create(StructureRole.prototype);

TowerRole.run = function(tower) {
    // First, kill enemies.
    if (TowerRole.shootNearestEnemy(tower)) return;
        
    // Next, heal allies.
    if (TowerRole.healNearestAlly(tower)) return;
        
    // Finally, repair.
    if (TowerRole.repairNearestStructure(tower)) return;
}

/**
* Instructs the tower to shoot the nearest enemy.
* @param tower {StructureTower} The tower.
* @returns {?Creep} The enemy creep we are shooting.
*/
TowerRole.shootNearestEnemy = function(tower) {
    var enemies = tower.room.find(FIND_HOSTILE_CREEPS);
    var enemyToShoot = null;
    if (enemies.length) {
        var enemyToShoot = tower.pos.findClosestByRange(enemies);
        tower.attack(enemyToShoot);
    }
    return enemyToShoot;
}

/**
* Instructs the tower to heal the nearest ally.
* @param tower {StructureTower} The tower.
* @returns {Creep} The ally healed.
*/
TowerRole.healNearestAlly = function(tower) {
    var wounded = tower.room.find(FIND_MY_CREEPS, {filter: (c) => {return c.hits < c.hitsMax;}});
    var allyToHeal = null;
    if (wounded.length) {
        allyToHeal = tower.pos.findClosestByRange(wounded);
        tower.heal(allyToHeal);
    }
    return allyToHeal;
}

/**
* Instructs the tower to repair the nearest structure in need of repair.
* @param tower {StructureTower} The tower.
* @returns {Structure} The structure repaired.
*/
TowerRole.repairNearestStructure = function(tower) {
    // Don't do walls or ramparts because those can be repaired FOREVER.
    var damagedStructures = Memphis.getStructuresThatNeedRepair((s) => {return s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART});
    var structureToRepair = null;
    if (damagedStructures.length) {
        structureToRepair = tower.pos.findClosestByRange(damagedStructures);
        tower.repair(structureToRepair);
    }
    return structureToRepair
}