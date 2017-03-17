/**
* Role for colonist that harvests energy. They are responsible for setting up the
* Colony infrastructure (roads and containers) and then depositing energy into the containers.
* @class
* @extends ColonistRole
*/
var ColonistWorkerRole = function() {};
ColonistWorkerRole.prototype = Object.create(ColonistRole);

ColonistWorkerRole.harvestingCheck = function(creep) {
    if (!creep.memory.harvesting && _.sum(creep.carry) == 0) creep.memory.harvesting = true;
    if (creep.memory.harvesting && _.sum(creep.carry) == creep.carryCapacity && typeof creep.memory.mySource !== "undefined") creep.memory.harvesting = false;
}

ColonistWorkerRole.buildUnbuiltColonyRoad = function(creep) {
    var mySource = Game.getObjectById(creep.memory.mySource);
    var homeSpawn = Game.getObjectById(creep.memory.home);
    var roadSite = null;
    if (!Memphis.spawnHasRoadsTo(homeSpawn, creep.memory.mySource)) {
        // See if there are roads to complete.
        roadSite = creep.buildNearestSite((s) => {return s.structureType == STRUCTURE_ROAD});
        if (roadSite) return roadSite;
        // If not, continue the roads.
        if (mySource) { // TODO: Fix this hack! If no one is in the room with the source, we forget where it is.
            roadSite = SiteFinder.continueRoadTo(mySource.pos, homeSpawn.pos);
            if (roadSite) {
                creep.moveTo(roadSite, {maxRooms:16});
                return roadSite;
            } else {
                Memphis.markSpawnHasRoadsTo(mySource);
                Memphis.markColonyRoadsBuilt(homeSpawn, creep.memory.colonyIndex);
            }
        } else { // If we forgot where our source is, drop everthing to return to the colony.
            creep.drop(RESOURCE_ENERGY);
            creep.memory.harvesting = true;
        }
    }
    return roadSite;
}

// TODO: Investigate bug where multiple containers are built around a single source.
// is that still a thing that happens? It could THEORETICALLY happen, but only if
// multiple creeps HAPPENED to be done harvesting in the same tick.
ColonistWorkerRole.buildAndDepositIntoContainer = function(creep) {
    // Then, if there are no containers, we should build one.
    var mySourceContainers = creep.pos.findInRange(FIND_STRUCTURES, 3, {filter: (s) => {return s.structureType == STRUCTURE_CONTAINER;}});
    if (mySourceContainers.length == 0) {
        creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER)
    } else {
        Memphis.markColonyContainersBuilt(Game.getObjectById(creep.memory.home), creep.memory.colonyIndex);
    }

    // Finally, if we have our container, we deposit.
    for (var i in mySourceContainers) {
        var container = mySourceContainers[i];
        if (_.sum(container.store) < container.storeCapacity) {
            if (creep.transfer(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) creep.moveTo(container);
        }
    }
}

ColonistWorkerRole.run = function(creep) {
    // Check room for needed repairs.
    creep.checkUnownedStructureRepair();

    // Check if we are harvesting or not.
    ColonistWorkerRole.harvestingCheck(creep);

    // First, if we are home and need to harvest, we need to head out for the colony.
    if (creep.memory.harvesting && ColonistRole.inHomeRoom(creep)) {
        ColonistRole.goToColony(creep);
        return;
    }

    // If we are not home, we must be at the colony room.
    var mySource = Game.getObjectById(creep.memory.mySource);
    // If we need more resources find the nearest source.
    if (creep.memory.harvesting) {
        // TODO: Replace this functionality with the skip-tick task queue upgrade.
        if (mySource && mySource.energy > 0) creep.goToAndHarvestOrWithdrawEnergy(mySource);
        else {
            var harvestSource = creep.harvestFromNearestSource();
            if (harvestSource instanceof Source) creep.memory.mySource = harvestSource.id;
        }
        return;
    }

    // Otherwise, we are full on resources, and should maintain the colony.
    // First, check for repairs
    if (creep.repairNearestStructureNeedingRepair((s) => { return s.structureType == STRUCTURE_ROAD || s.structureType == STRUCTURE_CONTAINER})) return;
    // Then, we want to make sure we build a road.
    if (ColonistWorkerRole.buildUnbuiltColonyRoad(creep)) return;
    // If the road is built, we should no longer be in the home room.
    // If we are in the home room, we need to drop our stuff to head back
    if (ColonistRole.inHomeRoom(creep)) {
        creep.drop(RESOURCE_ENERGY);
        return;
    }
    // Once back at the colony, if a container needs building, we help with that.
    if (creep.buildNearestSite((s) => {return s.structureType == STRUCTURE_CONTAINER})) return;
    // Then, we should make sure we are close to our source.
    if (!creep.pos.isNearTo(mySource.pos)) {
        creep.moveTo(mySource, {maxRooms:16});
        return;
    }
    // Then, we deposit into our container (build one if necessary).
    ColonistWorkerRole.buildAndDepositIntoContainer(creep);
}