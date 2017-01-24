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

var FEED_SPAWN = 'feed_spawn'
var FEED_BASE = 'feed_base'

var init_mover_spawn = function(creep_memory)
{
    creep_memory.role = 'mover'
    creep_memory.subrole = FEED_SPAWN
}

var init_mover_base = function(creep_memory)
{
    creep_memory.role = 'mover'
    creep_memory.subrole = FEED_BASE
}

/// Takes energy only from storage
class Mover 
{
    constructor() 
    {
        Memory.drill_spots = []
        this.max_range = 1
        this.num_feed_spawn = 0
        this.num_feed_base = 0
        this.role = 'mover'

        Memory.need_objects = 1
    }
    
    init_recipes(HoP)
    {   
        var recipes_mover = 
        {
            mover_mk1: {carry:3, move:3},   // 300
            /*
            mover_mk2: {carry:6, move:6},   // 600
            mover_mk3: {carry:8, move:8},   // 800
            mover_mk4: {carry:10, move:10}, // 1000*/
        }

        var recipes_feeder = 
        {
            feeder_mk1: {carry:3, move:3},   // 300
        }

        console.log("Initializing recipes for Mover class")
        HoP.memorize_recipe_simple("mover", recipes_mover, init_mover_spawn)
        HoP.memorize_recipe_simple("feeder", recipes_feeder, init_mover_base)
    }
    
    start_turn()
    {
        this.num_feed_spawn = 0
        this.num_feed_base = 0
    }
    
    /** @param {StructureSpawn} spawn **/ 
    check_spawn(spawn)
    {
        if(spawn.population_available('feeder') < 2)
            spawn.room.enqueue('feeder')
        if(spawn.population_available('mover') < 1)
            spawn.room.enqueue('mover')
    }
    
    /** Searching for dump **/
    process_search_drop(creep)
    {
        //console.log("Finding suitable target for " + creep.name + " with role="+creep.memory.subrole)
        var target
        var controller = (this)

        if(creep.memory.subrole == FEED_SPAWN)
        {
            target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, 
            {
                filter: (structure) => {
                    var result = false;
                    var t = structure.structureType
                    return (t == STRUCTURE_EXTENSION || t == STRUCTURE_SPAWN || t == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
                }
            });
        }
        else if(creep.memory.subrole == FEED_BASE)
        {
            target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, 
            {
                filter: (structure) => 
                {    
                    var t = structure.structureType;
                    //console.log('Structure' + structure + " is considered");
                    if(t == STRUCTURE_CONTAINER || t == STRUCTURE_STORAGE)
                    {
                        var valid = controller.valid_drop(creep, structure);
                        return valid && (structure.store[RESOURCE_ENERGY] < structure.storeCapacity);
                    }
                    return (structure.energyCapacity > 0) && (structure.energy < structure.energyCapacity);
                }
            });
        }
        
        if(target) 
        {
            var type = this.get_container_info(target)
            //console.log("Picked drop target="+target+" type="+type)
            creep.memory.target = target.id
            creep.memory.state = AIState.MoveDrop
            creep.moveTo(target)
            creep.say("pidu! "+target.id)
            return true
        }
        else
        {
        //    console.log("Failed find")
        }
    }

    /// Return some container info
    get_container_info(container)
    {
        /*var pos = container.pos
        var look = container.room.lookAt(pos);
        var flag
        look.forEach(function(obj) 
        {
            if(obj.type == LOOK_FLAGS) 
            {
                flag = obj.flag
            }
        });

        if(flag)
        {
            return flag.memory.role
        }*/
        if('memory' in container)
        {
            var info = container.memory
            if(info && info.type)
                return info.type
        }
        return 'none'
    }

    valid_pick(creep, container)
    {
        var role = this.get_container_info(container)
        /*
                mine_src  base_src/storage
        movers   0          1                  feeds internal base
        feeders  1          0                  moves resources to the base
        */
        if(creep.memory.subrole == FEED_SPAWN)
            return role != 'upgrade';
        else if(creep.memory.subrole == FEED_BASE)
        {
            //console.log("FEED_BASE pick checks " + container + " role=" + role)
            return role == 'source'
        }
        return false
    }

    valid_drop(creep, container)
    {
        var role = this.get_container_info(container)
        /*
        */
        if(creep.memory.subrole == FEED_BASE)
        {
            var result = (role != 'source')
            //console.log("FEED_BASE drop checks " + container + " role=" + role + " picked=" + result)
            return result
        }
        else if(creem.memory.subrole == FEED_SPAWN)
        {
            return true
        }
    }

    process_search_pick(creep)
    {
        var controller = (this)

        var target = creep.pos.findClosestByPath(FIND_STRUCTURES, 
        {
            filter: (structure) => {
                var t = structure.structureType
                return (t == STRUCTURE_CONTAINER || t == STRUCTURE_STORAGE) && 
                    structure.store[RESOURCE_ENERGY] > 0 && 
                    controller.valid_pick(creep, structure);
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
            if(target.transfer(creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
            {
                creep.memory.state = AIState.Idle   
                creep.memory.target = 0
                return true
            }
            else
            {
                creep.say("Picked")
                creep.memory.state = AIState.MoveDrop
                creep.memory.target = 0
                return true
            }
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
        //console.log("Returning with harvest to "+creep.memory.target)
        var pos = creep.pos
                
        if( creep.carry.energy == 0 )
        {
            //console.log("Out of energy. Return to initial state")
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
                if(!creep.moveTo(target))
                {
                    creep.say('Camodump')
                    creep.memory.target = 0
                    creep.memory.state = AIState.SearchDump   
                }
            }
        }
        else
        {
            console.log("Has invalid target. Will reset")
            creep.memory.target = 0
            creep.memory.state = AIState.Idle
        }
    }
    
    process_idle(creep)
    {
        if(creep.carry.energy > 0)
        {
            //console.log("Mover " + creep.name + " still has " + creep.carry.energy + "eg")
            creep.memory.state = AIState.SearchDrop;
        }
        else
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
            case AIState.MoveRecycle:
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
        this.movers++

        if(!creep.memory.state)
            creep.memory.state = AIState.Idle
        if(!creep.memory.subrole)
            creep.memory.subrole = FEED_SPAWN

        var iterations = 5
        do
        {
            var old_state = creep.memory.state

            this.step_fsm(creep)    
        }while(old_state != creep.memory.state && iterations--)
        //console.log("Creep "+creep.name+" finished update in "+(5-iterations)+" iterations with state "+creep.memory.state)
	}
}

module.exports = new Mover();
