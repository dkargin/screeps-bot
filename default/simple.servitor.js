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
	console.log("===> Servitor Give " + obj.name + " amount="+amount)
	/// Ensure table exists
	Memory.servitor_give = Memory.servitor_give || {}
	Memory.servitor_give[obj.id] = Memory.servitor_give[obj.id] || {amount : amount, time: time}
}

/// Get task resources that belong to task flag
Flag.prototype.get_flag_res = function()
{
	var room = Game.rooms[this.room]
	var result = {}
}

function pick_task_flag(flag, creep)
{
	var energy = creep.pos.findInRange(FIND_DROPPED_ENERGY,1);
    if (energy.length > 0) 
    {
    	var rez = energy[0]
    	console.log('found ' + rez.energy + ' energy at ', energy[0].pos);
        creep.pickup(rez);
        
        flag.amount = rez.amount
        /// Picked all
        if(rez.amount == 0)
        {
        	flag.remove()
        	creep.target = undefined
        }
    }
    else
    {
    	console.log("Arrived, but no rez is found")
    	flag.remove()
    	creep.target = undefined
    }
}

function process_job(creep)
{
	creep.set_state('MoveGet')
}
/** @param {Creep} creep **/
function process_moveget(creep)
{
	//console.log(creep.name + " moveget");
	
	if(creep.carry.energy == creep.carryCapacity)
	{
		creep.set_state('MovePut')
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
    		pick_task_flag(creep.target, creep)
    	}
    	else
    	{
    		creep.moveTo(creep.target)
    	}
    }
    else if(creep.carry.energy > 0)
    {
    	creep.set_state('MovePut')
    	creep.say("Return")
    }
}

/// Transfer energy to an object, suitable for 'transfer' function
function action_give_object(creep, target)
{
	return creep.transfer(target, RESOURCE_ENERGY)
}

/// Pick from ground
function action_pick_ground(creep, target)
{
	/// TODO: impelement
}

function action_pick_container(creep, target)
{
	/// TODO: implement
}

function action_pick_creep(creep, target)
{
	/// is moving
}

function filter_structures(obj)
{
	t = obj.structureType;
	return (t == STRUCTURE_EXTENSION || t == STRUCTURE_SPAWN || t == STRUCTURE_TOWER) && 
		obj.energy < obj.energyCapacity;
}

/// Filter creeps (or any sort of objects) that registered in 'take' table
function filter_creep_take(obj)
{
	return obj.id in Memory.servitor_give
}

/// Check whether creep should move closer to a target
function check_should_move(creep)
{
	 
}

///FIND_STRUCTURES
function find_target(creep, type, filter, action)
{
	delete creep.memory.target
	var target = creep.pos.findClosestByPath(type, {filter: filter});
	if(target)
	{
		creep.memory.target = target.id
		creep.memory.action = action
		creep.memory.target_pos = target.pos
		return true
	}
	return false
}

/// Actions to be applied when the target is reached
var TargetActions = 
{
	pick_container : action_pick_container,
	pick_creep : action_pick_creep,
	pick_ground : action_pick_ground,
	give_object : action_give_object,
}

function clear_target(creep)
{
	if('target' in creep.memory)
		delete creep.memory.target
		
	if('action' in creep.action)
		delete creep.memory.action
	
	if('target_pos' in creep.memory)
		delete creep.memory.target_pos
}

function process_moveput(creep)
{
	/// And then find 'pick' targets 
	Memory.servitor_give = Memory.servitor_give || {}
	
	if(creep.carry.energy == 0)
	{
		creep.target = 0
		creep.set_state('MoveGet')
		creep.say("Goget")
		return true
	}
	
	/// We fill spawn and tower first
	if(!creep.memory.target)
	{
		if( find_target(creep, FIND_STRUCTURES, filter_structures, 'give_object') ||
			find_target(creep, FIND_MY_CREEPS, filter_creep_take, 'give_object'))
		{
			var obj = Game.getObjectById(creep.memory.object)
			console.log(creep.name + " transfering res to object at " + obj.pos)
		}
		else
		{
			console.log(creep.name + " failed to find any GIVE target")
		}
	}
	
	if(creep.memory.target && creep.memory.action) 
	{
		var action = TargetActions[creep.memory.target]
		var object = Game.getObjectById(creep.memory.object)
		
		if(action(creep, object) == ERR_NOT_IN_RANGE) 
		{
            creep.moveTo(creep.target);
        }
	}
	else
	{
		console.log(creep.name + " cleaning target data")
		clear_target(creep)
		return true
	}
	return false
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
		
		var result = 3
		/*
		if(caps.mine > 0)
			result += ((caps.mine+1) /2)
		if(caps.upgrade > 0)
			result += (caps.upgrade+1)/4
		*/ 
		return result
	}
	
	init(creep)
	{
		creep.override_states({MoveGet : process_moveget, MovePut: process_moveput, Job:process_job})
	}
};