var AIState = 
{ 
    Idle : 0, 
    SearchMine : 1, 
    MoveMine : 2, 
    Mining : 3, 
    MoveDump : 4, 
    Pick : 5, 
    SearchLoot: 6, 
    LongDrill : 7, 
    MoveLongDrill: 8, 
    SearchDump : 9, 
    MoveBuild: 10, 
    Building: 11,
    MoveRecycle: 12,    /// Return to be recycled
}

init_drill = function(creep)
{
    creep.memory.role = "harvester"
}

init_mover = function(creep)
{
    creep.memory.mover = "mover"
}

class Harvester 
{
    constructor() 
    {
        this.sources = []
        this.source_spots = []
        Memory.drill_spots = []
        this.max_range = 1
        this.harvesters = 0
        this.role = 'harvester'
        Memory.need_harvesters = 1
        Memory.last_harvester = 0
        
        if(!('mine_info' in Memory))
        {
            Memory.mine_info = {}
        }
        
        for(var i in Game.spawns)
            this.analyse_mines(Game.spawns[i])
    }
    
    init_recipes(HoP)
    {
        // Recipes for heavy drill
        //
        var recipes_drill = {
            worker_mk1: {work:2, carry:1, move:1},                                  // 300
            worker_mk2: {work:3, carry:1, move:1},                                  // 400
            worker_mk3: {work:4, carry:1, move:1},                                  // 500
            worker_mk4: {work:5, carry:1, move:1},                                  // 600
            worker_mk5: {work:6, carry:1, move:1},                                  // 700
            worker_mk6: {work:7, carry:1, move:1},                                  // 800
            worker_mk7: {work:8, carry:1, move:1},                                  // 900
        }
        
        var recipes_mover = 
        {
            mover_mk1: {carry:1, move:1}
        }
        console.log("Initializing recipes for Harvester class")
        HoP.memorize_recipe_simple("miner", recipes_drill, init_drill)
        HoP.memorize_recipe_simple("mover", recipes_mover, init_mover)
    }
    
    /** Will find and fill in mining spots **/
    analyse_mines(spawn)
    {
        //console.log("Updating mine info")
        var sources = spawn.room.find(FIND_SOURCES);
        
        var pos = spawn.pos
        for(var i in sources)
        {
            var mine = sources[i]
            
            var tmp = mine.memory
            
            if(mine.id in Memory.mine_info)
               continue;
            //if(!('user' in Memory.mine_info))
            //    Memory.mine_info.user = {}
            var path = pos.findPathTo(mine.pos)
            var distance = path.length
            
            var spots = []
            var max = 0
            
            if(path)
            {
                for(var x = mine.pos.x-1; x <= mine.pos.x+1; x++)
                    for(var y = mine.pos.y-1; y <= mine.pos.y+1; y++)
                    {
                        if(x == mine.pos.x && y == mine.pos.y)
                            continue;
                        var spot_pos = new RoomPosition(x,y, mine.pos.roomName)
                        var tile = Game.map.getTerrainAt(spot_pos)

                        if(tile != 'wall')
                        {
                            spots.push(spot_pos)
                            var res = mine.room.createFlag(spot_pos, "Minespot_"+x+":"+y)
                            if(res == ERR_NAME_EXISTS)
                            {
                                
                            }
                            else
                            {
                                console.log("Created mine spot flag")
                            }
                        }
                    }
                max = spots.length
            }
            
            var info = {
                spots : spots,
                distance : distance,
                max : max,
                current : 0,
                users : {},
            }   
            
            Memory.mine_info[mine.id] = info
            
        }
        
        var total_harvesters = 0
        for(var i in Memory.mine_info)
        {
            var info = Memory.mine_info[i]
            var harvesters_per_mine = info.max + Math.round(info.distance / 4);
            //console.log("Mine "+i+" needs "+harvesters_per_mine+" harvesters")
            total_harvesters = total_harvesters+ harvesters_per_mine
        }
        //console.log("Need " + total_harvesters + " harvesters")
        
        Memory.need_harvesters = total_harvesters
    }
    
    start_turn()
    {
        this.harvesters = 0
        for(var i in Memory.mine_info)
    	{
        	var mine = Memory.mine_info[i]
        	var deleted = {}
        	
        	var hanged = 0
        	for(var u in mine.users)
    		{
    		    var creep = Game.getObjectById(u)
    		    if(!creep || (creep.memory.state != AIState.MoveMine && creep.memory.state != AIState.Mining))
    		    {
    		        deleted[u] = 1
    		        hanged++
    		    }
    		}
    		
    		if(hanged > 0)
    		{
    		    mine.current -= hanged
    		    console.log("Cleaning " + hanged + " occupied spots")
        		for(var u in deleted)
        		{
        		    delete mine.users[u]
        		}
    		}
    	}
    }
    
    /** @param {StructureSpawn} spawn **/ 
    check_spawn(spawn)
    {
        if(Memory.need_harvesters > this.harvesters && !spawn.spawning)
        {
            var recipe = this.get_best_recipe(spawn)
            
            var new_id = Memory.last_harvester;
            
            var retries = 5
            while(retries--)
            {
                var result = spawn.createCreep(recipe, "Harvester #"+new_id, {role: 'harvester'})
                if(result == OK)
                {
                    Memory.last_harvester++;
                    console.log("Created harvester: "+recipe)
                    break
                }
                if(result == -3)
            	{
                	Memory.last_harvester++;
                	continue
            	}
                else
                {
                    console.log("Failed to build harvester " + recipe + ":" + result)
                    
                }
                break
            }
        }
    }
    
    
    get_recipe_cost(body)
    {
        return body.reduce(function (cost, part) 
        {
            return cost + BODYPART_COST[part];
        }, 0);
    }
    /** @param {StructureSpawn} spawn **/
    get_best_recipe(spawn)
    {
        // spawn.getM
        var recipes = 
        [
            /*[WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE],
            [WORK, WORK, CARRY, CARRY, MOVE, MOVE],
            [WORK, WORK, CARRY, CARRY, MOVE],*/
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
        //console.log("Best="+best+" cost = "+this.get_recipe_cost(recipes[i])+" max="+spawn.energyCapacity)
        return best
    }
    
    /** @param {Creep} creep **/
    own(creep)
    {
        if (!creep.memory)
        {
            creep.memory = {}
        }
        
        if(!('state' in creep.memory))
        {
            creep.memory.state = AIState.Idle
            creep.memory.target = 0 // Current target id
            creep.memory.spot = 0   // Mining spot index
        }
    }
    
    // Free spot and allow it to be used by other harvesters
    /** @param {ID} spot - ID of selected mine **/
    /** @param {Creep} creep- user of selected mine **/
    free_mine(spot, creep)
    {
        if(!Memory.mine_info)
            return
        var info = Memory.mine_info[spot]
        if(!info)
        {
            console.log("Invalid mine id="+spot)
            return
        }
        if(info.current >  0)
        {
            info.current--;
        }
        delete info.users[creep.id]
        console.log("Mine id="+spot+"pos="+Game.getObjectById(spot).pos + " is freed, used=" + info.current)
    }
    
    pick_mine(creep)
    {
        if(!('mine_info' in Memory))
            return
        for(var id in Memory.mine_info)
        {
            var mine = Game.getObjectById(id)
            if(!mine)
                continue
            
            var info = Memory.mine_info[id]
            var free = info.max - info.current
            if(free > 0)
            {
                console.log("Picking mine="+mine.pos + " with "+free+' of ' + info.max + ' spots')
                info.current ++
                if(!('users' in info))
                    info['users'] = {}
                info.users[creep.id] = 1
                return mine
            }
            else
            {
                console.log("Mine="+mine.pos + " is full with " + info.max + ' spots')
            }
        }
        /*
        var sources = creep.room.find(FIND_SOURCES);
        if(sources.length > 0)
            return sources[0]*/
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
    /// Sticks to mining spot and drills forever
    process_longdrill(creep)
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
    
    find_mine(creep)
    {
        
    }
    
    process_search_loot(creep)
    {
        creep.memory.state = AIState.SearchMine
        //console.log(creep+' stopped searching for loot')
    }
    
    /** **/
    process_search_dump(creep)
    {
        //console.log("Finding suitable target")
        var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    if(structure.structureType == STRUCTURE_CONTAINER)
                        return structure.store[RESOURCE_ENERGY] < structure.storeCapacity;
                    return (structure.energyCapacity > 0) && structure.energy < structure.energyCapacity;
                }
        });
        /*  == STRUCTURE_EXTENSION ||
                            structure.structureType == STRUCTURE_SPAWN ||
                            structure.structureType == STRUCTURE_TOWER || 
                            structure.structureType == STRUCTURE_CONTAINER */
        
        if(targets.length > 0) 
        {
            var target = targets[0]
            creep.memory.target = target.id
            creep.memory.state = AIState.MoveDump
            creep.say("pidu! "+target.id)
            return true
        }
        
        var target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
        if(target)
        {
            creep.moveTo(target)
            creep.memory.target = target.id
            creep.memory.state = AIState.MoveBuild
            creep.say("Pibi! "+target.id)
            return true
        }
    }
    
    process_move_mine(creep)
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
        }
        return false;
    }
    
    /** Move to building site **/
    process_move_build(creep)
    {
        var pos = creep.pos
        if(creep.carry.energy == 0)
        {
            creep.say("Noe! :(")
            creep.memory.target = 0
            creep.memory.state = AIState.Idle
        }
	    
	    var target = Game.getObjectById(creep.memory.target)
	    if(target)
	    {
            if(creep.pos.inRangeTo(target, 1))
            {
                creep.memory.state = AIState.Building
                creep.say("Rebi!") // Reached building
            }
            else
            {
                creep.moveTo(target);
            }
	    }
	    else
	    {
	        creep.say("Nota :(")
            creep.memory.target = 0
            creep.memory.state = AIState.SearchDump
	    }
    }
    
    /** Do building stuff **/
    process_build(creep)
    {
        //console.log(creep.name + " building ")
        var target = Game.getObjectById(creep.memory.target)
        if(!target)
        {
            console.log(creep.name + " build target is lost ")
            creep.say("Nota :(")
            creep.memory.target = 0
            creep.memory.state = AIState.SearchDump
            return
        }
        if(creep.pos.inRangeTo(target, 1))
        {
            //creep.memory.state = AIState.Mining
            if(creep.build(target) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
            
            
        }
        else
        {
            creep.moveTo(target);
        }
        
        if(creep.carry.energy == 0)
        {
            creep.memory.target = 0
            creep.memory.state = AIState.Idle
            creep.say("Bidone")
        }
    }
    
    process_move_dump(creep)
    {
        //console.log("Returning with harvest")
        var pos = creep.pos
        var target = Game.getObjectById(creep.memory.target)
        
        if( creep.carry.energy == 0 )
        {
            creep.memory.target = 0
            creep.memory.state = AIState.Idle;
            return;
        }
        
        if(target)
        {
            //console.log("Got target. Moving")
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
        creep.memory.state = AIState.SearchLoot;
    }
    
    analyse_body(creep)
    {
        var parts = {}
        for(var i in creep.body)
        {
            var part = creep.body[i]
            //console.log(part.type)
            if(part.type in parts)
                parts[part.type]++
            else
                parts[part.type] = 1
        }
        return parts
    }
    
    step_fsm(creep)
    {
        //console.log("updating creep="+creep.name+" state="+creep.memory.state)
        switch(creep.memory.state)
        {
            case AIState.Idle:
                this.process_idle(creep);
                break;
            case AIState.SearchLoot:
                this.process_search_loot(creep);
                break;
            case AIState.SearchMine:
                this.process_search_mine(creep);
                break;
            case AIState.SearchDump:
                this.process_search_dump(creep);
                break;
            case AIState.MoveMine:
                this.process_move_mine(creep)
                break;
            case AIState.Mining:
                return this.process_mining(creep);
            case AIState.MoveDump:
                return this.process_move_dump(creep);
            case AIState.MoveBuild:
                return this.process_move_build(creep);
            case AIState.Building:
                return this.process_build(creep)
        }
    }
    
    /** @param {Creep} creep **/
    run(creep) 
    {
        if(!creep)
            return
        this.own(creep)
        this.harvesters++
        
        var iterations = 5
        do
        {
            var old_state = creep.memory.state
        //console.log(creep+' state='+creep.memory.state + ':' + this.analyse_body(creep))
            this.step_fsm(creep)
            /*
            if(old_state != creep.memory.state)
            {
                console.log(creep.name + " state changed from "+old_state + " to " + creep.memory.state)
            }*/
            //break;
            
        }while(old_state != creep.memory.state && iterations--)
	}
}

module.exports = new Harvester();
