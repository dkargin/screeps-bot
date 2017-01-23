
init_upgrader = function(creep_memory)
{
    console.log("Initializing upgrader system for")
    creep_memory.role = "upgrader"
}

class Upgrader
{
    constructor() 
    {
        this.upgraders = 0
        this.role = "upgrader"
        
        if(!('last_upgrader' in Memory))
            Memory.last_upgrader = 0
    }
    
    init_recipes(HoP)
    {
        // Recipes for heavy drill
        //
        var recipes_upgrader = {
            upgrader_mk1: {work:1, carry:2, move:2},                                  // 300
        }
        console.log("Initializing recipes for Harvester class")
        HoP.memorize_recipe_simple("upgrader", recipes_upgrader, init_upgrader)
    }
    
    start_turn()
    {
        this.upgraders = 0
    }
    
    check_spawn(spawn)
    {
        console.log("Checking upgraders: " + this.upgraders)
        
        if(spawn.population_available('upgrader') < 3)
        {
            spawn.room.enqueue('upgrader')
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
                    var t = structure.structureType
                    return (t == STRUCTURE_CONTAINER || t == STRUCTURE_STORAGE) && structure.store[RESOURCE_ENERGY] > 0;
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