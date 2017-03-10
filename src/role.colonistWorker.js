

var colonistWorker = {
    run: function(creep) {
        
        creep.checkRoadRepair();
        
        var homeSpawn = Game.getObjectById(creep.memory.home);
        if (!homeSpawn) return;
        var homeRoom = homeSpawn.room;
        
        var colonyDirection = creep.memory.colonyDirection;
        if (typeof colonyDirection == "undefined") return;
        
        if (!creep.memory.harvesting && _.sum(creep.carry) == 0) creep.memory.harvesting = true;
        if (creep.memory.harvesting && _.sum(creep.carry) == creep.carryCapacity && typeof creep.memory.mySource !== "undefined") creep.memory.harvesting = false;
        
        // First, if we are home and need to harvest, we need to head out for the colony.
        if (creep.memory.harvesting && creep.room.name === homeRoom.name) {
            var exit = null;
            switch(colonyDirection) {
                case BOTTOM:
                    exit = creep.pos.findClosestByPath(FIND_EXIT_BOTTOM);
                    break;
                case TOP:
                    exit = creep.pos.findClosestByPath(FIND_EXIT_TOP);
                    break;
                case LEFT:
                    exit = creep.pos.findClosestByPath(FIND_EXIT_LEFT);
                    break;
                case RIGHT:
                    exit = creep.pos.findClosestByPath(FIND_EXIT_RIGHT);
                    break;
            }
            
            if (exit !== null) {
                if (exit === creep.pos) creep.move(colonyDirection);
                else creep.moveTo(exit);
            }
            return;
            // I assume this moves it to the next room?
            
        }
        
        // If we are not home, we must be at the colony room.
        
        // If we need more resources find the nearest source.
        if (creep.memory.harvesting) {
            var harvestSource = creep.harvestFromNearestSource();
            if (harvestSource instanceof Source) creep.memory.mySource = harvestSource.id;
            return;
        }
        
        var mySource = Game.getObjectById(creep.memory.mySource);
        
        if (!creep.memory.harvesting) {
            // First, check for repairs
            if (creep.repairNearestStructureNeedingRepair((s) => { return s.structureType == STRUCTURE_ROAD || s.structureType == STRUCTURE_CONTAINER})) return;
            
            // Then, we want to make sure we build a road.
            if (!homeSpawn.memory.hasRoadsTo[creep.memory.mySource]) {
                // See if there are roads to complete.
                var roadToBuild = creep.buildNearestSite((s) => {return s.structureType == STRUCTURE_ROAD});
                // If not, continue the roads.
                if (!roadToBuild) {
                    if (mySource) { // TODO: Fix this hack! If no one is in the room with the source, we forget where it is.
                        var nextRoadSite = siteFinder.continueRoadTo(mySource.pos, homeSpawn.pos);
                        if (!nextRoadSite) {
                            homeSpawn.memory.hasRoadsTo[creep.memory.mySource] = true;
                            homeSpawn.memory.colonies[creep.memory.colonyIndex].roadsBuilt = true;
                        } else {
                            creep.moveTo(nextRoadSite);
                            return;
                        }
                    } else {
                        creep.drop(RESOURCE_ENERGY);
                        creep.harvesting = true;
                    }
                    return;
                } else {
                    return;
                }
            }
            
            if (creep.name == "Jayce") console.log("here");
            
            // If we are in the home room, we need to drop our stuff and head back
            if (creep.room.name == homeSpawn.room.name) {
                creep.drop(RESOURCE_ENERGY);
                return;
            }
            
            // Next, we return to the source and ensure there is a container.
            // First, if there is container construction, we want to help.
            if (creep.room.name !== homeSpawn.room.name) {
                var containerToBuild = creep.buildNearestSite((s) => {return s.structureType == STRUCTURE_CONTAINER});
                if (containerToBuild) return;
            }
            // Then, we should make sure we are close to our source.
            if (!creep.pos.isNearTo(mySource.pos)) {
                creep.moveTo(mySource);
                return;
            }
            // Then, if there are no containers, we should build one.
            var mySourceContainers = creep.pos.findInRange(FIND_STRUCTURES, 3, {filter: (s) => {return s.structureType == STRUCTURE_CONTAINER;}});
            if (mySourceContainers.length == 0) {
                creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);
                return;
            }
            // Finally, if we have our container, we deposit.
            for (var i in mySourceContainers) {
                var container = mySourceContainers[i];
                if (_.sum(container.store) < container.storeCapacity) {
                    if (creep.transfer(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) creep.moveTo(container);
                    return;
                }
            }
        }
    }
};