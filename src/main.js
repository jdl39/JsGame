// TODO: Set maxRooms in moveTo to prevent wandering creeps.
module.exports.loop = function () {
    PathFinder.use(true);
    Utils.onTick();

    // Cleanup bad memory.
    for (var key in Memory.creeps) {
        if (!Game.creeps[key]) {
            delete Memory.creeps[key];
        }
    }
    
    // Handle Spawns
    for (var name in Game.spawns) {
        var spawn =  Game.spawns[name];
        if (spawn.memory.role == roleNames.SPAWN_DEFAULT) {
            spawnRoleDefault.run(spawn, spawn.memory.desiredHarvesterPopulation, spawn.memory.desiredBuilderPopulation, spawn.memory.desiredUpgraderPopulation, spawn.memory.desiredMilitiaPopulation);
        }
    }
    
    // Handle towers
    var towers = _.filter(Game.structures, (s) => {return s.structureType == STRUCTURE_TOWER;});
    for (var i in towers) {
        var tower = towers[i];
        towerRoleDefault.run(tower);
    }

    // Handle Creeps
    Creep.onTick();
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        creep.onTick();
        
        if(creep.memory.role == roleNames.HARVESTER) {
            roleHarvester.run(creep);
        }
        if(creep.memory.role == roleNames.UPGRADER) {
            roleUpgrader.run(creep);
        }
        if(creep.memory.role == roleNames.BUILDER) {
            roleBuilder.run(creep);
        }
        if (creep.memory.role == roleNames.MILITIA) {
            roleMilitia.run(creep);
        }
        if (creep.memory.role == roleNames.COLONIST_WORKER) {
            roleColonistWorker.run(creep);
        }
        if (creep.memory.role == roleNames.COLONIST_TRADER) {
            roleColonistTrader.run(creep);
        } 
    }
}