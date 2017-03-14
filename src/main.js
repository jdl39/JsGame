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

    var miliTaken = {};
    // Handle Creeps
    for(var name in Game.creeps) {
        var t1 = new Date().getTime();
        var creep = Game.creeps[name];
        creep.onTick();
        CreepRole.findRoleAndRun(creep);

        if (!miliTaken[creep.memory.role]) miliTaken[creep.memory.role] = 0;
        miliTaken[creep.memory.role] += new Date().getTime() - t1;
    }

    //for (var k in miliTaken) console.log(k + ": " + miliTaken[k]);
    //console.log("\n\n");
}