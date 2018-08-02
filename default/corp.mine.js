/** 
 * Mining corporation
 * Corporation consists of:
 * - miner
 * - storage nearby the mine
 * - specialised mover to deliver harvest
**/

var CreepBase = require('./creepbase')

require('./corporation')


// Calculates a mine rate for specified creep
// @param creep - creep object
function miningRate(creep)
{
    if(!creep)
        return 0
    var nwork = creep.getActiveBodyparts(Game.WORK)
    return 2*nwork
}

// Calculates mover performance, average energy per tick
// @param creep
function transfer_rate(creep, distance)
{
    if(!creep)
        return 0
    let nmove = creep.getActiveBodyparts(Game.MOVE)
    let ncarry = creep.getActiveBodyparts(Game.CARRY)
    return 25*nstore*nmove / (distance*(nmove + 2*nstore))
}

// Roles for MineCorp

// Main miner. We have one for each mine
const ROLE_MINER = "Miner"
// Mining helper for the case when RCL+spawner are too low to spawn best miner. 
// Also assistant is created to replace old miner. Assistant becomes main miner 
// when main is dead for some reason
const ROLE_ASSISTANT = "Assistant"
// Scuttle. Moves energy from miner spots to unloading position. Drops energy under main miner
const ROLE_TRUCK = "MTruck"
// This worker is spawned when room is completely empty and there are no workers
const ROLE_STARTER = "Starter"
	
// Corp property
PROPERTY_CONTAINER = 1
PROPERTY_ROAD = 2
PROPERTY_RAMP = 3

/*
 * Equipment:
 * Container1
 */
global.MineCorp = class extends Corporation
{
	// @param room - Room object
	// @param info - persistent room info
    constructor(room, info)
    {
        super("MineCorp", room)
        if (!info)
            throw new Error("Empty info")
        if (!('mines' in info))
        	throw new Error("room info has no mines!")
        
        this.mines = []
        
        // Caches for occupied jobs
        this.assistants = []
        this.miners = []
        this.starters = []
        this.trucks = []
        
        var delim = '@'
        
        var totalMines
        var totalDist = 0
        for (let mineId in info.mines)
    	{
        	var mine = info.mines[mineId]
        	console.log("\t processing mine id=" + mineId + " :" + JSON.stringify(mine))
        	// Right now we are capable only of E gathering
        	if (mine.res != 'E')
        	{
        	    console.log('skipping mine pos='  + mine.pos + " res=" + mine.res)
        		continue;
        	}
        	
        	this.mines.push({
        		pos: [mine.pos[0], mine.pos[1]],
        		id: mine.id,
        		type: mine.type,
        	})
        	
        	let i = this.mines.length-1;
        	// Allocate specific corporate positions
        	
        	this.personnel[ROLE_MINER+delim+i] = {
    			mine: Game.getObjectById(mine.id),
    			work: mine.spot,
    		}
        	
        	this.personnel[ROLE_ASSISTANT+delim+i] = {
        		mine: Game.getObjectById(mine.id)
        	}
        	
        	this.personnel[ROLE_STARTER+delim+i] = {
        		mine: Game.getObjectById(mine.id)
        	}
        	
        	totalMines++;
        	if ('path' in mine)
        	{
        		totalDist += mine.path.length
        	}
    		else
			{
    			throw new Error("Should have precomputed paths")
			}
    	}
        
        if (totalDist > 0)
        {
        	var numTrucksMax = _.ceil(totalDist/300)
        	console.log("Will need " + numTrucksMax + " transports" + " total dist=" + totalDist)
        	
        	for(let i = 0; i < numTrucksMax; i++)
        	{
        		this.personnel[ROLE_TRUCK+delim+i] = {
            		mine: Game.getObjectById(mine.id)
            	}	
        	}
        }
        
        // TODO: Should revisit existing equipment and check if it fits current layout
        
        this.memory.personnel = this.memory.personnel || [] 
        
        // TODO: Should revisit existing personnel and check if it fits current layout
        var invalidPositions = []
        
        for (let i in this.memory.personnel)
        {
        	var record = this.memory.personnel[i]
        	
        	var id = record[0]
        	var position = record[1]
        	var state = record[2]
        	
        	if (!('position' in this.personnel))
        		invalidPositions.push(position)
        	else
        	{
	        	var obj = Game.getObjectById(obj)
	        	this.personnel[position] = 
	        	{
	        		obj:obj,
	        		state:state,
	        	}
        	}
        }
    }
    
    /// How much we need to invest to make optimal revenue
    investmentCost()
    {
    	var store_cost = 5000
    	/// Cost for road construction
    	var road_cost = 300*(this.memory.distance || 0) /// TODO: implement
    	/// Drill cost
    	var miner_cost = 0		// TODO: calculate
    	/// Total cost for all movers
    	var movers_cost = 0
    	return store_cost + road_cost + miner_cost + movers_cost
    }

    /**
     * Set new unload position.
     * Servitors will unload all the resources there
     * @param dest - array of coordinates or an object
     */
    setUnloadDestination(dest)
    {
        /// TODO: implement
    }
    
    // Check if personnel is alive. Remove personal that is dead
    checkPersonnel()
    {
    	var tier = this.room.get_tech_tier()
    	
		var assistants = this.getJobs(ROLE_ASSISTANT)
		var starters = this.getJobs(ROLE_STARTER)
		var miners = this.getJobs(ROLE_MINER)
		var trucks = this.getJobs(ROLE_TRUCK)
		
    	if (tier <= 1)
		{
    		// Roles here: 
		}
    	else if (tier == 2)
    	{
    		// Assistants can work here.
    		// Should reassign all starters to assistant roles
    	}
    	else if (tier == 3)
    	{
    		
    	}
    	else if (tier >= 4)
    	{
    		
    	}
    	
    	// Every time we find free mine spot - reassign assistants or starters to this job
    	if (tier > 1)
    	{
    		if (miners.length)
    		{
    			
    		}
    	}
    	
        /*
         * TODO: Check if we still need any starters
         *  Need them only tier < 2
         * TODO: Check if we need any assistants.
         * 	Need them only till tier3 
         */
    }
    
    // Get body blueprint for a specified position
    getBlueprint(position)
    {
        var tier = this.room.get_tech_tier()
        if(position.startsWith(ROLE_SCUTTLE))
        {
            if(tier >= 3)
			    return { name: 'SV', body : unpack_recipe({carry:8, move:8}), mem : {role:this.role(), tier: 3 } } 
    		else if(tier == 2)
    			return { name: 'SV', body : unpack_recipe({carry:5, move:5}), mem : {role:this.role(), tier: 2 } }	
    		else
    		    return { name: 'SV', body : unpack_recipe({carry:3, move:3}), mem : {role:this.role(), tier: 1 } }
        }
        else if (position.startsWith(ROLE_STARTER))
        {
            return {name: 'SM', body : unpack_recipe({work:2, carry:1, move:1}), mem : {role:this.role(), tier : 1 } }
        }
        else    // if (position.startsWith(ROLE_MINER) || position.startsWith(ROLE_ASSISTANT) || ROLE_STARTER)
        {
    		if(tier >= 3)
    			return { name: 'SM', body : unpack_recipe({work:5, carry:2, move:4}), mem: {role:this.role(), tier : 3 } } 
    		else if(tier == 2)
    			return { name: 'SM', body : unpack_recipe({work:4, carry:1, move:2}), mem: {role:this.role(), tier: 2 } }	
    		else
    			return { name: 'SM', body : unpack_recipe({work:2, carry:1, move:1}), mem: {role:this.role(), tier : 1 } }
        }
    }
    
    // Calculate current vacancy lists
    getVacancies()
    {
        var result = []
        
        return result
    }
    
    total_transfer_rate()
    {
        /// TODO: Calculate effective distance, checking the roads
        var distance = this.memory.distance
        var income = 0
        
        for(var m in this.memory.movers)
        {
            var obj = Game.getObjectById(this.memory.movers[m])
            if(obj)
                income += this.transfer_rate(obj, distance)
        }
        
        return income
    }

    /// Checks whether mine has enough movers
    /// @returns {number} positive number,  if enough
    check_movers_enough()
    {
        var mine_income = this.get_mine_income()
        var transfer = this.get_transfer_rate()
        return transfer - mine_income
    }
    
    /// Get average mine income, per tick
    get_mine_income()
    {
        var income = 0
        income += this.mineRate(Game.getObjectById(this.memory.drill))
        for(var m in this.memory.workers)
        {
            var obj = Game.getObjectById(this.memory.workers[m])
            if(obj)
                income += this.mine_rate(obj, distance)
        }
        
        var max_income = 4000/300
        if(income > max_income)
            income = max_income
        return income
    }
    
    getUnloadPos()
    {
        var obj = Game.getObjectById(this.memory.unload_id)
        return Game.getObjectPos(obj)
    }
    
    // Creep found inconsistency with its job and it asks for a new position
    findBetterJob(creep)
    {
    	
    }
}

/**
 * All creep functions get following data:
 * {
 * 	 mine - mine object to be harvested
 *   site - construction site to be built. Miners will get a ref to 
 * }
 */
MinerStates = 
{
	// Arriving to a mine
	arriving: function(creep, corp, data)
	{
		//var source = creep.pos.findClosestByPath(FIND_SOURCES);
		var source = data.mine
		if (!isNear(creep.pos, source.pos))
		{
            creep.moveTo(source);
        }
        else
        {
        	creep.setState('mining')
        	return true;
        }
	},
	mining: function(creep, corp, data)
	{
		var source = Game.getObjectById(data.target)
		if(source && creep.harvest(source) == ERR_NOT_IN_RANGE) 
		{
            creep.moveTo(source);
        }
		
		// Check if we should build something as well
		if (data.spot && creep.carry.energy == creep.carryCapacity)
		{
			creep.setState('building')
		}
	},
	building: function(creep, corp, data)
	{
		var site = data.site
		if (site)
		{
			if (creep.carry.energy > 0)
				creep.build(site);
			else
			{
				creep.setState('mining')
			}
		}
		else
		{
			creep.setState('mining')
		}
	}
}


class CorpMiner extends CreepBase.Behaviour 
{
    constructor()
    {
        super()    
    }
    
	role()
	{
		return 'CorpMiner'
	}
	
	/// Return creep capabilities
	getCapabilities(creep)
	{		
		return { mine : creep.getActiveBodyparts(WORK) }
	}
	
	get_desired_population(room)
	{
		var tier = room.get_tech_tier()
		if(tier >= 3)
			return 2	/// TODO: number of mines
		return get_mine_spots(room.name)*2
	}
	
	init(creep)
	{
		creep.overrideStates(MinerStates)
	}
};


// States for starter creep
StarterStates = {
	mining:function(creep, corp, data)
	{
		/// Go mining
	    if(creep.carry.energy < creep.carryCapacity) 
	    {
	    	var source = creep.pos.findClosestByPath(FIND_SOURCES);
	        if(source && creep.harvest(source) == ERR_NOT_IN_RANGE) {
	            creep.moveTo(source);
	        }
	        else
	        {
	        	creep.target = source
	        }
	    }
	    else
	    {
	    	creep.say("Return")
	    	creep.setState('returning')
	    }
	},
	returning:function(creep, corp, data)
	{
		if(creep.carry.energy == 0)
		{
			creep.target = 0
			creep.setState('Job')
			creep.say("Gomine")
			return true
		}
		
		// Feeding spawn
		if(!creep.target)
		{
	    	var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
	            filter: (structure) => 
	    		{
	                return (structure.structureType == STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity;
	            }
	        });
	    	creep.target = target
	    	creep.target_action = () => creep.transfer(creep.target, RESOURCE_ENERGY)
		}

		// Construction stuff. Maybe we should not do it by this creep
		if(!creep.target)
		{
			if(creep.target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES))
			{
				creep.target_action = () => creep.build(creep.target);
			}
		}
		
		if(creep.target && creep.target_action) 
		{
			if(creep.target_action() == ERR_NOT_IN_RANGE)
			{
	            creep.moveTo(creep.target);
	        }
		}
		else
		{
			delete creep.target
			delete creep.target_action
		}
		return false
	}
}

class CorpStarter extends CreepBase.Behaviour 
{
    constructor()
    {
        super()    
    }
    
	role()
	{
		return 'CorpStarter'
	}
	
	/// Return creep capabilities
	getCapabilities(creep)
	{		
		return { mine : creep.getActiveBodyparts(WORK) }
	}
	
	get_desired_population(room)
	{
		var tier = room.get_tech_tier()
		if(tier >= 3)
			return 2	/// TODO: number of mines
		return get_mine_spots(room.name)*2
	}
	
	init(creep)
	{
		creep.overrideStates(StarterStates)
	}
};