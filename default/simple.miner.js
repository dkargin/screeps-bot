/**
 * 
 */

var State =
{
	Mining : 0,
	Returning : 1,
	Dropping : 2, 	/// Going to drop
}

var roleHarvester = 
{
	role : function()
	{
		return 'simple.miner'
	},
	
	spawn : function(room) 
	{
		var tier = room.get_tech_tier()
		if(tier < 2)
			return {
				body : [WORK, WORK, CARRY, MOVE], mem : {role:this.role(), tier : 1 }
			}
		return {
				body : [WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE], mem : { role:this.role(), tier: 2 }
			}
	},
	/// Return creep capabilities
	get_capabilities : function()
	{		
		return {
			mine : this.getActiveBodyparts(WORK), 
			feed_spawn : this.getActiveBodyparts(CARRY) 
		}
	},
	
	get_demands : function()
	{
		return {
			servitor : 1
		}
	},
	
	get_desired_population: function(room)
	{
		return 4
	},
	
    /** @param {Creep} creep **/
	process_mining: function(creep)
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
        	var caps = creep.room.get_capabilities()
        	if(caps.servitor == 0)
        	{
	        	this.set_state(creep, State.Returning)
	        	console.log("No servitor is available")
	        	creep.say("Return")
        	}
        	else
        	{
        		creep.say("Drop")
        		creep.room.servitor_take(creep.pos, creep.carry.energy)
        		creep.drop(RESOURCE_ENERGY);
        	}
        }
	},
	
	process_returning : function(creep)
	{
		if(creep.carry.energy == 0)
    	{
    		creep.target = 0
    		this.set_state(creep, State.Mining)
    		creep.say("Gomine")
    		return true
    	}
    	
		if(!creep.target)
		{
        	var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (structure) => 
        		{
                    return (structure.structureType == STRUCTURE_EXTENSION ||
                            structure.structureType == STRUCTURE_SPAWN ||
                            structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
                }
	        });
        	creep.target = target
        	creep.target_action = () => creep.transfer(creep.target, RESOURCE_ENERGY)
		}
		
		if(!creep.target)
		{
			if(creep.target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES))
			{
				creep.target_action = () => creep.build(creep.target);
			}
		}
		
		if(creep.target && creep.target_action) 
		{
			if(creep.target_action() == ERR_NOT_IN_RANGE) {
	            creep.moveTo(creep.target);
	        }
		}
		else
		{
			delete creep.target
			delete creep.target_action
		}
		return false
	},
	process_fsm : function(creep) {
		switch(creep.memory.state)
        {
        case State.Mining: return this.process_mining(creep)
        case State.Returning: return this.process_returning(creep)
        }
		return false
	},
	get_state : function(creep)
	{
		return creep.memory.state 
	},
	set_state : function(creep, new_state)
	{
		creep.memory.state = new_state
	},
    run: function(creep) 
    {
    	creep.get_capabilities = this.get_capabilities
        if(!('state' in creep.memory))
        {
        	console.log("Implanting state to a creep")
        	this.set_state(creep, State.Mining)
        }
        	
        if(Memory.debug && Memory.debug.simple_miner)
        	console.log("Processing creep=" + creep.name + " role=" + creep.memory.role + " state=" + this.get_state(creep))
        
        for(var i = 1; i < 5; i++)
        {
	        if(!this.process_fsm(creep))
	        	break
        }
    }
};

module.exports = roleHarvester;