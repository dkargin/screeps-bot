/**
 * Behaviour for worker class
 *  
 */

var State =
{
	MoveGet : 0,
	MovePut : 1,
}

Room.prototype.get_servitor_info = function()
{
	this.memory.servitors = this.memory.servitors || {}
	
	var info = this.memory.servitors
	info.last_take_flag = info.last_take_flag || 1
	info.last_give_flag = info.last_give_flag || 1
	info.free_take_flag = info.free_take_flag || []
	info.free_give_flag = info.free_give_flag || []
	
	return info
}

/// Someone wants to take away resources
/// @pos  
Room.prototype.servitor_take = function(pos, amount)
{
	var flag
	
	var flags = this.lookForAt(LOOK_FLAGS, pos)
	
	if(flags.length > 0)
	{
		console.log("Found #" + flags.length + " flags at pos " + pos)
		flag = flags[0]
	}
	else
	{
		var info = this.get_servitor_info()
		var name = name = info.free_take_flag.pop()
		if(!name)
			name = "Take#" + this.name + (info.last_take_flag++)
	
		if(this.createFlag(pos, name) == ERR_NAME_EXISTS)
		{
			console.log("Failed to create take flag " + name + " at: " + pos)
		}
		
		var flag = Game.flags[name]
		flag.memory.role = "take"
		flag.memory.type = "servitor"
	}
	if(!flag)
		return
	
	if(!flag.memory.amount)
		flag.memory.amount = amount
	else
		flag.memory.amount += amount
			
	flag.memory.tick = Game.time
}

/// @obj wants delivery
/// @amount - number of res to be delivered
/// @time - time of the delivery
Room.prototype.servitor_give = function(obj, amount, time)
{
	console.log("===> Servitor Give " + obj.name + " amount="+amount)
	/// Ensure table exists
	Memory.servitor_give = Memory.servitor_give || {}
	Memory.servitor_give[obj.id] = Memory.servitor_give[obj.id] || {amount : amount, time: time}
	
	
}


module.exports = {
	role : function() 
	{
		return 'simple.servitor'
	},
	
	spawn : function(room) 
	{
		var tier = room.get_tech_tier()
		if(tier > 1)
			return {name : "SV", 
				body : [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], mem : {
					role:this.role(), tier: 2 }
			}
		return {name : "SV",
			body : [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE], mem : {
				role:this.role(), tier : 1 }
		}
	},
	
	/// Return creep capabilities
	get_capabilities : function()
	{		
		return { feed_spawn : 1, servitor : 1 }
	},
	
	get_desired_population : function(room)
	{
		var caps = room.get_capabilities()
		
		var result = 0
		if(caps.mine > 0)
			result += ((caps.mine+1) /2)
		if(caps.upgrade > 0)
			result += (caps.upgrade+1)/4 
		return result
	},
	
    /** @param {Creep} creep **/
	process_moveget: function(creep)
	{
		creep.get_capabilities = this.get_capabilities
    	
		if(creep.carry.energy == creep.carryCapacity)
		{
			this.set_state(creep, State.MovePut)
        	creep.say("Return")
		}
		/// Go mining
        if(!creep.target)
        {
        	var filter = (flag) =>
        	{
        		return flag.memory.type == "servitor"
        	}
        	
        	creep.target = creep.pos.findClosestByPath(FIND_FLAGS, { filter: filter } );
        }
        
        if(creep.target)
        {
        	/// Check if target is dropped rez
        	if(creep.pos.getRangeTo(creep.target) == 1)
        	{
        		var energy = creep.pos.findInRange(FIND_DROPPED_ENERGY,1);
    	        if (energy.length) 
    	        {
    	        	var rez = energy[0]
    	        	console.log('found ' + rez.energy + ' energy at ', energy[0].pos);
    	            creep.pickup(rez);
    	            /// Picked all
    	            if(rez.amount == 0)
    	            {
    	            	creep.room.removeFlag(creep.target.name)
    	            }
    	        }
        	}
        	else
        	{
        		creep.moveTo(creep.target)
        	}
        }
	},
	
	process_moveput : function(creep)
	{
		if(creep.carry.energy == 0)
    	{
    		creep.target = 0
    		this.set_state(creep, State.MoveGet)
    		creep.say("Goget")
    		return true
    	}
    	
		/// We fill spawn and tower first
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
		
		/// And then find 'pick' targets 
		Memory.servitor_give = Memory.servitor_give || {}
		if(!creep.target)
		{
			var target = creep.pos.findClosestByPath(FIND_MY_CREEPS, {
                filter: (obj) => 
        		{
        			if(!(obj.id in Memory.servitor_give))
        				return false;
        			return true
                }
	        });
			
			creep.target = target
			console.log("He wants to get rez: " + creep.target)
			
			if(creep.target)
			{
				creep.target_action = () => creep.transfer(creep.target, RESOURCE_ENERGY);
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
	
	process_fsm : function(creep) 
	{
		switch(creep.memory.state)
        {
        case State.MoveGet: return this.process_moveget(creep)
        case State.MovePut: return this.process_moveput(creep)
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
        	this.set_state(creep, State.MoveGet)
        }
        	
        //if(Memory.debug && Memory.debug.simple_miner)
        	//console.log("Processing creep=" + creep.name + " role=" + creep.memory.role + " state=" + this.get_state(creep))
        
        for(var i = 1; i < 5; i++)
        {
	        if(!this.process_fsm(creep))
	        	break
        }
    }
};