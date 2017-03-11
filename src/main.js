/**
* The main game loop. It executes on every tick.
*/
module.exports.loop = function () {
    PathFinder.use(true);
    Utils.onTick();

    // Handle structures
    for (var i in Game.structures) {
        var structure = Game.structures[i];
        StructureRole.findRoleAndRun(structure);
    }

    // Handle Creeps
    Creep.onTick();
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        creep.onTick();
        CreepRole.findRoleAndRun(creep);
    }
}