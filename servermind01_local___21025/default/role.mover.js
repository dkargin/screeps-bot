var AIState = 
{ 
    Idle : 0, 
    SearchPick : 1, 
    SearchDrop : 2, 
    MovePick : 3, 
    MoveDrop : 4, 
    MoveRecycle: 5,    /// Return to be recycled
    MoveRecharge: 6,
    Recharge : 7,
}

init_drill = function(creep_memory)
{
    console.log("Initializing drill system for")
    creep_memory.role = "harvester"
}


/// Takes energy only from storage
class Mover 
{
    constructor() 
    {
        Memory.drill_spots = []
        this.max_range = 1
        this.movers = 0
        this.role = 'mover'

        Memory.need_objects = 1
    }
    
    init_recipes(HoP)
    {   
        var recipes_mover = 
        {
            mover_mk1: {carry:1, move:1}
        }

        console.log("Initializing recipes for Mover class")
        HoP.memorize_recipe_simple("mover", recipes_mover, init_mover)
    }
    
    check_storage()
    {

    }       

    start_turn()
    {
        this.movers = 0
    }
    
    /** @param {StructureSpawn} spawn **/ 
    check_spawn(spawn)
    {
    }
    
    process_search_mine(creep)
    {
        var mine = this.pick_mine(creep)
        if(mine)
        {
            if(creep.harvest(mine) == ERR_NOT_IN_RANGE) 
            {
                creep.memory.target = mine.id 
                creep.say("Momi!")
                creep.memory.state = AIState.MoveMine
            }
            else
            {
                creep.memory.state = AIState.Mining
                creep.memory.target = mine.id 
                creep.say("Remi!")
            }
        }
    }
    
    /** @param {Creep} creep **/
    process_mining(creep) 
    {
        //console.log("Creep="+creep.name+" is mining")
        var target = Game.getObjectById(creep.memory.target)
        if(creep.carry.energy < creep.carryCapacity) 
	    {
	        
	        if(!target)
	        {
	            console.log(creep.name + " has lost mining target:"+creep.memory.target)
	            creep.memory.state = AIState.SearchMine;
	            creep.memory.target = 0
                creep.say("Neeta") // need target
                return
	        }
	        
            //var sources = creep.room.find(FIND_SOURCES);
            var res = creep.harvest(target)
            if(res == ERR_NOT_IN_RANGE) 
            {
                creep.memory.state = AIState.SearchMine;
                this.free_mine(target.id, creep)
                creep.memory.target = 0
                creep.say("Neeta") // need target
            }
            else if(res == OK)
            {
                // OK
            }
            else
            {
                console.log(creep.name + " has lost mining target:"+res)
                creep.memory.state = AIState.SearchMine;
                this.free_mine(target.id, creep)
                creep.memory.target = 0
                creep.say("Neeta") // need target
            }
        }
        else
        {
             creep.say("Complete")
             this.free_mine(target.id, creep)
             creep.memory.target = 0;
             creep.memory.state = AIState.SearchDump;
        }
    }
    
    /** Searching for dump **/
    process_search_drop(creep)
    {
        //console.log("Finding suitable target")
        var targets

        if(creep.memory.subrole == 'feed_spawn')
        {
            target = creep.pos.findClosestByRange(FIND_STRUCTURES, 
            {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION 
                        || structure.structureType == STRUCTURE_SPAWN) && 
                    structure.energy < structure.energyCapacity;
                }
            });
        }
        else
        {
            target = creep.room.findClosestByPath(FIND_STRUCTURES, 
            {
                filter: (structure) => {
                    if(structure.structureType == STRUCTURE_CONTAINER)
                        return structure.store[RESOURCE_ENERGY] < structure.storeCapacity;
                    return (structure.energyCapacity > 0) && structure.energy < structure.energyCapacity;
                }
            });
        }
        
        if(target) 
        {
            creep.memory.target = target.id
            creep.memory.state = AIState.MoveDrop
            creep.say("pidu! "+target.id)
            return true
        }
    }

    valid_pick(creep, container)
    {
        return true;
    }

    process_search_pick(creep)
    {
        var controller = this
        var target = creep.room.findClosestByPath(FIND_STRUCTURES, 
        {
            filter: (structure) => {
                if(structure.structureType == STRUCTURE_CONTAINER)
                    return structure.store[RESOURCE_ENERGY] > 0 && controller.valid_pick(creep, structure);
                /// TODO: can use LARGE container
            }
        });

        if(target) 
        {
            creep.memory.target = target.id
            creep.memory.state = AIState.MovePick
            creep.say("pidu! "+ target.id)
            return true
        }
    }
    
    process_move_pick(creep)
    {
        //console.log(creep.name + " moving to mine")
        var target = Game.getObjectById(creep.memory.target)
        
        if(!target)
        {
            creep.say("Nota! :("); // No target!
            creep.memory.state = AIState.Idle
            creep.memory.target = 0
        }

        if(creep.pos.inRangeTo(target, 1))
        {
            creep.memory.state = AIState.Mining
            creep.say("Remi!"); // Reached mining site
            return true
        }
        else
        {
            creep.moveTo(target);
            creep.memory.target = target.id
        }
        return false;
    }
        
    process_move_drop(creep)
    {
        //console.log("Returning with harvest")
        var pos = creep.pos
                
        if( creep.carry.energy == 0 )
        {
            creep.memory.target = 0
            creep.memory.state = AIState.Idle;
            return;
        }

        var target = Game.getObjectById(creep.memory.target)
        
        if(target)
        {
            if(pos.inRangeTo(target,1))
            {
                if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    
                    creep.memory.target = 0
                    console.log("Dump target is lost")
                }
                
                //structure.energy < structure.energyCapacity
                if(target.energyCapacity == target.energy && creep.carry.energy > 0)
                {
                    creep.say('More')
                    creep.memory.target = 0
                    creep.memory.state = AIState.SearchDump
                }
            }
            else
            {
                creep.moveTo(target);
            }
        }
    }
    
    process_idle(creep)
    {
        creep.memory.state = AIState.SearchPick;
    }
    
    step_fsm(creep)
    {
        //console.log("updating creep="+creep.name+" state="+creep.memory.state)
        switch(creep.memory.state)
        {
            case AIState.Idle:
                return this.process_idle(creep);
            case AIState.SearchPick:
                return this.process_search_pick(creep);
            case AIState.SearchDrop:
                return this.process_search_drop(creep);
            case AIState.MovePick:
                return this.process_move_pick(creep);
            case AIState.MoveDrop:
                return this.process_move_drop(creep);
            case AIState.Mining:
                return this.process_move_recycle(creep);
            case AIState.MoveRecharge:
                return this.process_move_recharge(creep)
            case AIState.Recharge:
                return this.process_recharge(creep);
        }
    }
    
    /** @param {Creep} creep **/
    run(creep) 
    {
        if(!creep)
            return
        this.own(creep)
        this.movers++
        
        var iterations = 5
        do
        {
            var old_state = creep.memory.state
            this.step_fsm(creep)    
        }while(old_state != creep.memory.state && iterations--)
	}
}

module.exports = new Mover();
