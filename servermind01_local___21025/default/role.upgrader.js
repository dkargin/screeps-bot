
class Upgrader
{
    constructor() 
    {
        this.upgraders = 0
        this.role = "upgrader"
        
        if(!('last_upgrader' in Memory))
            Memory.last_upgrader = 0
    }
    
    /** @param {StructureSpawn} spawn **/
    get_best_recipe(spawn)
    {
        // spawn.getM
        var recipes = 
        [
            [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE],
            [WORK, WORK, CARRY, CARRY, MOVE, MOVE],
            [WORK, WORK, CARRY, CARRY, MOVE],
            [WORK, CARRY, CARRY, MOVE],
        ]
        var best = recipes[0]
        for(var i in recipes)
        {
            var cost = this.get_recipe_cost(recipes[i])
            if(spawn.canCreateCreep(recipes[i]) == OK)
            {
                best = recipes[i]
                break
            }
        }
        return best
    }
    
    start_turn()
    {
        this.upgraders = 0
    }
    
    check_spawn(spawn)
    {
        //console.log("Checking upgraders: " + this.upgraders)
        if(this.upgraders < 5)
        {
            spawn.createCreep([WORK, WORK, CARRY, MOVE], "Upgrader #"+(Memory.last_upgrader++), {role: 'upgrader'})
        }
    }
    
    /** @param {Creep} creep **/
    run(creep) {
        this.upgraders++;

        if(creep.memory.upgrading && creep.carry.energy == 0) {
            creep.memory.upgrading = false;
            creep.say('harvesting');
	    }
	    if(!creep.memory.upgrading && creep.carry.energy == creep.carryCapacity) {
	        creep.memory.upgrading = true;
	        creep.say('upgrading');
	    }

	    if(creep.memory.upgrading) {
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
            }
        }
        else 
        {
            //var storages = creep.room.find(FIND_STRUCTURES)
            var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY] > 0;
                }
                });
            
            if(target)
            {
                //if(creep.withdraw(target) == ERR_NOT_IN_RANGE)
                if(target.transfer(creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                {
                    creep.moveTo(target)
                }
                else
                {
                   // console.log("Upgrading from store "+target)
                }
            }
            else
            {
                var energy = creep.pos.findClosestByPath(FIND_DROPPED_ENERGY);
        
                if (energy) 
                {
                    //console.log('found ' + energy.energy + ' energy at ', energy.pos);
                    creep.pickup(energy);
                    if(creep.pickup(energy) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(energy);
                    }
                }
            }
            /// Never mine personally, harvesters do this job
            /*
            else
            {
                console.log("No storage - going to mine personally")
                var sources = creep.room.find(FIND_SOURCES);
                if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(sources[0]);
                }
            }*/
        }
	}
}

module.exports = new Upgrader();