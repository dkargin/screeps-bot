/**
 * 
 */
var roleHarvester = {
	role : function()
	{
		return 'simple.miner'
	},
	spawn : function() {
		return {
			body : [WORK, WORK, CARRY, MOVE], mem : {
				role:this.role() }
		}
	},
	required : 2,
    /** @param {Creep} creep **/
    run: function(creep) {
        console.log("Processing creep=" + creep.name + " role=" + creep.memory.role)
        if(creep.carry.energy < creep.carryCapacity) {
            var sources = creep.room.find(FIND_SOURCES);
            if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[0]);
            }
        }
        else {
            var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_EXTENSION ||
                                structure.structureType == STRUCTURE_SPAWN ||
                                structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
                    }
            });
            if(targets.length > 0) {
                if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0]);
                }
            }
        }
    }
};

module.exports = roleHarvester;