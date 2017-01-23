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

init_drill = function(creep_memory)
{
    console.log("Initializing drill system for")
    creep_memory.role = "harvester"
}

Room.prototype.has_movers = function()
{
    return true    
}

Object.defineProperty(Source.prototype, 'memory', {
    get: function() {
        if(_.isUndefined(Memory.sources)) {
            Memory.sources = {};
        }
        if(!_.isObject(Memory.sources)) {
            return undefined;
        }
        return Memory.sources[this.id] = Memory.sources[this.id] || {};
    },
    set: function(value) {
        if(_.isUndefined(Memory.sources)) {
            Memory.sources = {};
        }
        if(!_.isObject(Memory.sources)) {
            throw new Error('Could not set source memory');
        }
        Memory.sources[this.id] = value;
    }
});

Object.defineProperty(StructureContainer.prototype, 'memory', {
    get: function() {
        if(_.isUndefined(Memory.containers)) {
            Memory.containers = {};
        }
        if(!_.isObject(Memory.containers)) {
            return undefined;
        }
        return Memory.containers[this.id] = Memory.containers[this.id] || {};
    },
    set: function(value) {
        if(_.isUndefined(Memory.containers)) {
            Memory.containers = {};
        }
        if(!_.isObject(Memory.containers)) {
            throw new Error('Could not set source memory');
        }
        Memory.containers[this.id] = value;
    }
});


Object.defineProperty(StructureStorage.prototype, 'memory', {
    get: function() {
        if(_.isUndefined(Memory.storages)) {
            Memory.storages = {};
        }
        if(!_.isObject(Memory.storages)) {
            return undefined;
        }
        return Memory.storages[this.id] = Memory.storages[this.id] || {};
    },
    set: function(value) {
        if(_.isUndefined(Memory.storages)) {
            Memory.storages = {};
        }
        if(!_.isObject(Memory.storages)) {
            throw new Error('Could not set source memory');
        }
        Memory.storages[this.id] = value;
    }
});

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
        this.localBuild = true
        Memory.need_harvesters = 1
        Memory.last_harvester = 0
        
        if(!('mine_info' in Memory))
        {
            Memory.mine_info = {}
        }
        
        for(var i in Game.spawns)
            this.analyse_mines(Game.spawns[i])
    }


    /// Check if miner is heavy
    is_miner_heavy(creep)
    {
        
    }
    
    init_recipes(HoP)
    {
        // Recipes for heavy drill
        //
        var recipes_drill = {
            worker_mk1: {work:2, carry:1, move:1},                                  // 300
            worker_mk2: {work:3, carry:1, move:1},                                  // 400
            worker_mk3: {work:4, carry:1, move:1},                                  // 500
            /*
            worker_mk4: {work:5, carry:1, move:1},                                  // 600
            worker_mk5: {work:6, carry:1, move:1},                                  // 700
            worker_mk6: {work:7, carry:1, move:1},                                  // 800
            worker_mk7: {work:8, carry:1, move:1},                                  // 900*/
        }
        
        console.log("Initializing recipes for Harvester class")
        HoP.memorize_recipe_simple("miner", recipes_drill, init_drill)
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

            if(!('storage' in mine.memory))
                mine.memory.storage = 0

            if(!('build_storage' in mine.memory))
                mine.memory.build_storage = 0


            var storage_sites = mine.pos.findInRange(FIND_STRUCTURES, 2, 
            {
                filter: { structureType: STRUCTURE_CONTAINER }
            });

            for(var s in storage_sites)
            {
                storage_sites[s].memory = storage_sites[s].memory || {}
                storage_sites[s].memory.type = "source"                
            }

            console.log("Found "+storage_sites.length + " storage sites near mine " + mine.id)

            var storage_build_sites = mine.pos.findInRange(FIND_CONSTRUCTION_SITES, 2, 
            {
                filter: { structureType: STRUCTURE_CONTAINER }
            });
            console.log("Found "+storage_build_sites.length + " storage build sites near mine " + mine.id)
            
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
            total_harvesters = total_harvesters+ 1 //harvesters_per_mine
        }
        //console.log("Need " + total_harvesters + " harvesters")
        
        Memory.need_harvesters = total_harvesters //Memory.mine_info.length
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
        var available = spawn.population_available('miner')
        //console.log("Avail miners ="+available+" needed="+Memory.need_harvesters)
        if(available < Memory.need_harvesters)
        {
            spawn.room.enqueue('miner')
        }
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
        //console.log("Mine id="+spot+"pos="+Game.getObjectById(spot).pos + " is freed, used=" + info.current)
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

            if(mine.energy == 0)
                continue
            
            var info = Memory.mine_info[id]
            var free = info.max - info.current
            if(free > 0)
            {
                //console.log("Picking mine="+mine.pos + " with "+free+' of ' + info.max + ' spots')
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
                var tools = creep.getActiveBodyparts(Game.BODY)
                if(tools > 2/* && creep.memory.recipe == 'miner'*/)
                    creep.memory.state = AIState.LongDrill
                else
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
        //console.log("Creep="+creep.name+" is longdrilling")
        var target = Game.getObjectById(creep.memory.target)

        var tools = creep.getActiveBodyparts(Game.BODY)
        var pos = creep.pos
        if(creep.carry.energy + tools*2 < creep.carryCapacity) 
	    {
            
            if(creep.carry.energy > 0)
            {
                var drop = creep.pos.findInRange(FIND_STRUCTURES, 1, {
                    filter: (structure) => {
                        if(structure.structureType == STRUCTURE_CONTAINER)
                            return structure.store[RESOURCE_ENERGY] < structure.storeCapacity;
                        return (structure.energyCapacity > 0) && structure.energy < structure.energyCapacity;
                    }
                });
                if(drop)
                {
                    res = creep.transfer(drop, RESOURCE_ENERGY)
                    if(res != OK)
                    {
                        console.log("Longdrill failed to transfer resources, result = "+res)
                    }
                }
            }

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
        var tools = creep.getActiveBodyparts(Game.BODY)

        if(creep.carry.energy + tools*2 < creep.carryCapacity) 
	    {
            if(creep.carry.energy > 0)
            {
                /*
                if(!creep.memory.build_target) 
                {
                    var storage = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
                        filter: (structure) => {
                            return structure.structureType == STRUCTURE_CONTAINER;
                        }
                    });

                    if(storage.length > 0)
                    {
                        creep.memory.build_target = storage[0]
                    }
                }
                if(creep.memory.build_target)
                {
                    var res = creep.build(creep.memory.build_target)
                    console.log("Drill-build target "+res)
                }*/
            }

	        
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
    
    /** **/
    process_search_dump(creep)
    {
        if(creep.carry.energy == 0)
        {
            creep.memory.target = 0
            creep.state = AIState.Idle
            return true
        }
        //console.log("Finding suitable target")
        if(this.localBuild)            
        {
            var storage = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 2, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_CONTAINER;
                }
            });

            if(storage.length > 0)
            {
                //console.log("Found build site :"+storage[0]+"with id="+storage[0].id)
                creep.memory.build_target = storage[0]
                creep.memory.target = storage[0].id
                creep.memory.state = AIState.MoveBuild
                return true
            }
        }

        var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => {
                    var t = structure.structureType
                    if(t == STRUCTURE_CONTAINER)
                        return structure.store[RESOURCE_ENERGY] < structure.storeCapacity;
                    if(t == STRUCTURE_SPAWN || t == STRUCTURE_EXTENSION)
                        return (structure.energyCapacity > 0) && structure.energy < structure.energyCapacity;
                    /// Never dump anywhere else
                    return false
                }
        });
        /*  == STRUCTURE_EXTENSION ||
                            structure.structureType == STRUCTURE_SPAWN ||
                            structure.structureType == STRUCTURE_TOWER || 
                            structure.structureType == STRUCTURE_CONTAINER */
        
        if(target) 
        {
            creep.memory.target = target.id
            creep.memory.state = AIState.MoveDump
            creep.say("pidu! "+target.id)
            return true
        }
        
        /// Heavy miner does not build
        //if(!creep.is_heavy_worker() && creep.memory.recipe == 'miner')
        {
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
	        creep.say("Nobita :(")
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
        creep.memory.state = AIState.SearchMine;
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
            case AIState.LongDrill:
                return this.process_longdrill(creep)
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
