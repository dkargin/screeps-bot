/**
 * Behaviour for servitor class
 *  
 */

var CreepBase = require('creepbase') 

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
	
	/// Ensure table exists
	Memory.servitor_give = Memory.servitor_give || {}
	if(!(Memory.servitor_give[obj.id]))
	{
		console.log("===> Servitor Give " + obj.name + " amount="+amount)
	}
	
	Memory.servitor_give[obj.id] = Memory.servitor_give[obj.id] || {amount : amount, time: time, reserved : 0}
}

/// Get task resources that belong to task flag
Flag.prototype.get_flag_res = function()
{
	var room = Game.rooms[this.room]
	var result = {}
}

Flag.prototype.pick_task_flag = function(creep)
{
	var energy = creep.pos.findInRange(FIND_DROPPED_ENERGY,1);
    if (energy.length > 0) 
    {
    	var rez = energy[0]
    	console.log('found ' + rez.energy + ' energy at ', energy[0].pos);
        creep.pickup(rez);
        
        this.amount = rez.amount
        /// Picked all
        if(rez.amount == 0)
        {
        	this.remove()
        	creep.target = undefined
        }
    }
    else
    {
    	console.log("Arrived, but no rez is found")
    	this.remove()
    	creep.target = undefined
    }
}

function process_job(creep)
{
	creep.set_state('MoveGet')
}
/** @param {Creep} creep **/
function process_move_get(creep)
{
	//console.log(creep.name + " moveget");
	
	if(creep.carry.energy == creep.carryCapacity)
	{
		creep.set_state('FindPut')
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
    		creep.target.pick_task_flag(creep)
    	}
    	else
    	{
    		creep.moveTo(creep.target)
    	}
    }
    else if(creep.carry.energy > 0)
    {
    	creep.set_state('FindPut')
    	creep.say("Return")
    }
}



/**
 * Wrapper for servitor transfers
 * Checks transfer amount and decreases 'want' counter 
**/
Creep.prototype.servitor_transfe_structure = function(obj)
{
	//var before = obj.carry.energy
	var result = this.transfer(obj, RESOURCE_ENERGY)
	/// TODO: check transfer amount
	return result
}

Creep.prototype.servitor_transfer_creep = function(obj)
{
	if(!obj || !obj.carry)
	{
		console.log(this.name + " got strange creep for transfer: " + obj)
		return ERR_INVALID_TARGET
	}
	var before = obj.carry.energy
	var result = this.transfer(obj, RESOURCE_ENERGY)
	var transfered = obj.carry.energy - before
	var needs = Memory.servitor_give[obj.id]
	if(needs && result == OK)
	{
		needs.amount -= transfered
		needs.reserved -= transfered
		if(needs.reserved < 0)
			needs.reserved = 0
		if(needs.amount <= 0)
		{
			console.log(creep.name + " removing servitor_give for obj=" + obj.id)
			delete Memory.servitor_give[obj.id]
		}
	}
	return result
}


function filter_structures(obj)
{
	var t = obj.structureType;
	return (t == STRUCTURE_EXTENSION || t == STRUCTURE_SPAWN || t == STRUCTURE_TOWER) && 
		obj.energy < obj.energyCapacity;
}

/// Filter creeps (or any sort of objects) that registered in 'take' table
function filter_creep_take(obj)
{
	var result = obj.id in Memory.servitor_give
	
	if(obj.id in Memory.servitor_give)
	{
		var give = Memory.servitor_give[obj.id]
		console.log("Creep + " + obj.name + " has GIVE target: " + JSON.stringify(give))
		return give.amount > give.reserved
	}
	return false
	
	return result
}

/// Check whether creep should move closer to a target
function check_should_move(creep)
{
	var target_pos = get_target_pos(creep)
}

/// Actions to be applied when the target is reached
var TargetActions = 
{
	pick_container : function(creep, target) {},
	pick_creep : function(creep, target) {},
	pick_ground : function(creep, target) {},
	give_structure : function(creep, target)
	{
		//return creep.transfer(target, RESOURCE_ENERGY)
		return creep.servitor_transfe_structure(target)
	},
	give_creep : function(creep, target)
	{
		//return creep.transfer(target, RESOURCE_ENERGY)
		return creep.servitor_transfer_creep(target)
	},
}

function process_find_put(creep)
{
	/// And then find 'pick' targets 
	Memory.servitor_give = Memory.servitor_give || {}
	
	if(creep.carry.energy == 0)
	{
		creep.clear_target()
		creep.set_state('MoveGet')
		creep.say("Goget")
		return true
	}
	
	/// We fill spawn and tower first
	if(!creep.has_target())
	{
		//console.log(creep.name + " has no GIVE target")
		if( creep.find_closest_target(FIND_STRUCTURES, filter_structures, 'give_structure') ||
			creep.find_closest_target(FIND_MY_CREEPS, filter_creep_take, 'give_creep'))
		{
			var obj = Game.getObjectById(creep.memory.target)
			console.log(creep.name + " transfering res to object at " + obj.pos)
		}
		else
		{
			console.log(creep.name + " failed to find any GIVE target")
		}
	}
	
	if(creep.has_target()) 
	{
		var action = TargetActions[creep.memory.action]
		if(!action)
		{
			console.log(creep.name + " has invalid action. Clearing target")
			creep.clear_target()
			return true
		}
		var object = Game.getObjectById(creep.memory.target)
		var result = action(creep, object)
		switch(result)
		{
		case OK:
			break;
		case ERR_NOT_IN_RANGE:
			creep.moveTo(object); 
			break;
		case ERR_FULL:
			console.log(creep.name + " destination is full")
			creep.clear_target()
			return true
		case ERR_INVALID_TARGET:
			creep.clear_target()
			return true
		}
	}
	else
	{
		console.log(creep.name + " cleaning target data")
		creep.clear_target()
		return true
	}
	return false
}

function process_move_put(creep)
{
	if(creep.memory.target && creep.memory.action) 
	{
		var action = TargetActions[creep.memory.action]
		var object = Game.getObjectById(creep.memory.target)
		
		if(action(creep, object) == ERR_NOT_IN_RANGE) 
		{
            creep.moveTo(object);
        }
	}
	else
	{
		console.log(creep.name + " cleaning target data")
		creep.clear_target()
		creep.set_state('FindPut')
		return true
	}
	
	if(creep.carry.energy == 0)
	{
		creep.clear_target()
		creep.set_state('Free')
		return true
	}
}



module.exports = new class extends CreepBase.Behaviour
{
	role() 
	{
		return 'simple.servitor'
	}
	
	spawn(room) 
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
	}
	
	/// Return creep capabilities
	get_capabilities()
	{		
		return { feed_spawn : 1, servitor : 1 }
	}
	
	get_desired_population(room)
	{
		var caps = room.get_capabilities()
		
		var result = 0
		///Servitors should be limited only by mine rate and travel distance
		if(caps.mine > 0)
			result += (caps.mine / 2)
		return Math.ceil(result)
	}
	
	init(creep)
	{
		creep.override_states({
			MoveGet : process_move_get, 
			FindPut: process_find_put, 
			MovePut: process_move_put,
			Job:process_job
		})
	}
};