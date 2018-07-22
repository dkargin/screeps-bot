/**
 * Behaviour for servitor class
 *  
 */

var CreepBase = require('creepbase') 

/// Someone wants to take away resources
/// @pos  
Room.prototype.servitor_take = function(pos, amount)
{
	var flag
	
	var flags = this.lookForAt(LOOK_FLAGS, pos)
	
	if(flags.length > 0)
	{
		for(var f in flags)
		{
			if(flags[f].role == "take")
			{
				flag = flags[f]
				console.log("Picked existing TAKE flag " + flag.name)
			}
		}
	}
	
	if(!flag)
	{
		name = "T#" + this.name + "X" + (pos.x) + "Y" + (pos.y)
		if(this.createFlag(pos, name, COLOR_BROWN) == ERR_NAME_EXISTS)
		{
			//console.log("Failed to create take flag " + name + " at: " + pos)
		}
		
		flag = Game.flags[name]
		
	}
	
	if(!flag)
	{
		console.log("No take flag at pos " + pos)
		return
	}
	
	flag.memory.role = "take"
	flag.memory.type = "servitor"
	if(!flag.memory.amount)
		flag.memory.amount = amount
	else
		flag.memory.amount += amount
			
	flag.memory.tick = Game.time
}

/// @obj wants delivery
/// @amount - number of res to be delivered
/// @time - time of the delivery
Room.prototype.servitor_give = function(obj, amount, time, tag = "")
{
	/// Ensure table exists
	Memory.servitor_give = Memory.servitor_give || {}
	if(!(Memory.servitor_give[obj.id]))
	{
		//console.log("===> Servitor Give " + obj.name + " amount="+amount)
	}
	
	Memory.servitor_give[obj.id] = Memory.servitor_give[obj.id] || {amount : amount, time: time, reserve : {}, tag : tag}
}

/**
 * Reserve some part of delivery
 * Reservation prevents multiple servitors to 'overdeliver' resources to the target
 * @param obj - delivery target
 * @param amount - amount that will be reserved
 * @param time - estimated tick of delivery
 */
Room.prototype.servitor_reserve_give = function(obj, amount, time)
{
	/// TODO: implement
	var info = Memory.servitor_give[obj.id]
	if(info)
	{
		if(amount > info.amount)
			amount = info.amount
		info.reserve = info.reserve || {}
		info.reserve[obj.id] = {amount : amount, time: time}
	}
}

/// Get task resources that belong to task flag
Flag.prototype.get_flag_res = function()
{
	var room = Game.rooms[this.room]
	var result = {}
	throw new Error("NotImplemented")
}

Flag.prototype.update_task = function(force)
{
	var tick = Game.tick
	/// Update flag status every 10 ticks
	if(!this.memory.time || (tick - this.memory.time) > 10 || force)
	{
		
		var drop = this.pos.lookFor(LOOK_RESOURCES)
		if(drop.length > 0)
			this.memory.drop = drop[0].id
		
		var flag = this

		/// Remove dead objects from the reservation
		for(var i in this.memory.reserve)
		{
			if(!Game.getObjectById(i))
			{
				delete this.memory.reserve[i]
			}
		}
			
		_.forEach(this.pos.lookFor(LOOK_STRUCTURES), function(obj)
		{
			if(obj.structureType == STRUCTURE_CONTAINER)
			{
				flag.memory.container = obj.id
			}
		})

		//console.log("Updated task flag=" + this.name + " amount="+this.total_stored() + " reserve="+this.total_reserved())
	}
	else
	{

	}
}

Flag.prototype.reserve_task_flag = function(creep, amount = 0)
{
	if(!amount)
		amount = creep.carryCapacity - creep.carry.energy
		
	//console.log(creep.name + " reserves TAKE flag at " + this.pos + " amount="+ amount)
	
	this.memory.reserve = this.memory.reserve || {}
	this.memory.reserve[creep.id] = 
	{
			amount:amount,
			name:creep.name, 
			tick : Game.time
	}
}

Flag.prototype.pick_task_flag = function(creep, pickAmount)
{
	this.update_task(true)
	
	if(!pickAmount)
	{
		pickAmount = creep.carryCapacity - creep.carry.energy
	}
	
	console.log("Will pick " + pickAmount)

	var transfered = 0
	var obj
	
    if (this.memory.drop && (obj = Game.getObjectById(this.memory.drop))) 
    {
    	//console.log('found ' + obj.energy + ' energy at ', this.pos);
    	
    	var before = obj.amount 
        creep.pickup(obj, pickAmount);
        this.memory.amount = obj.amount
        transfered = (obj.amount - before)
        pickAmount -= transfered
    }
    
    if(pickAmount > 0 && this.memory.container && (obj = Game.getObjectById(this.memory.container)))
	{
    	var available = obj.store.energy
    	var toPick = pickAmount
    	if(available < toPick)
    		toPick = available
    		
    	console.log('found ' + obj.store.energy + ' storage at ', this.pos);
    	obj.transfer(creep, RESOURCE_ENERGY, toPick)
    	pickAmount -= toPick
    	transfered += toPick
	}
    
    /// Remove creep reserve
    if(this.memory.reserve && creep.id in this.memory.reserve)
    	delete this.memory.reserve[creep.id]
    
    /// Picked all
    if(this.total_stored() == 0)
    {
    	console.log("Pick flag is completely empty, transfered = " + transfered)
    	this.remove()
    }
    return transfered
}

Flag.prototype.total_stored = function()
{
	var result = 0
	if(this.memory.drop )
	{
		var obj = Game.getObjectById(this.memory.drop)
		if(obj)
			result += obj.amount
	}
	
	if(this.memory.container)
	{
		var obj = Game.getObjectById(this.memory.container)
		if(obj)
			result += obj.store.energy
	}	
	return result
}

Flag.prototype.total_reserved = function(creep)
{
	var result = 0
	this.memory.reserve = this.memory.reserve || {}
	
	_.forEach(this.memory.reserve, function(info, id)
	{
		if(creep && id == creep.id)
			return
		//console.log("Adding reservation " + id + "=" + JSON.stringify(info))
		result += info.amount
	})
	return result
}

/**
 * Wrapper for servitor transfers
 * Checks transfer amount and decreases 'want' counter 
**/
Creep.prototype.servitor_transfer_structure = function(obj)
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
		
		if(needs.reserve && needs.reserve[this.id])
			delete needs.reserve[this.id]
		
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
	if(!obj.isActive())	/// It takes 'Average' CPU
		return false
	return (t == STRUCTURE_EXTENSION || t == STRUCTURE_SPAWN || t == STRUCTURE_TOWER) && 
	//return (t == STRUCTURE_EXTENSION || t == STRUCTURE_SPAWN) &&
		obj.energy < obj.energyCapacity;
}

/// Filter creeps (or any sort of objects) that registered in 'take' table
function filter_creep_take(obj)
{
	var result = (obj.id in Memory.servitor_give)
	
	if(obj.id in Memory.servitor_give)
	{
		var give = Memory.servitor_give[obj.id]
		
		var reserved = 0
		for(var i in give.reserve)
		{
			var reserve = give.reserve[i]
			reserved += reserve.amount
		}
		
		//console.log("GIVE target " + obj.name + " reserved=" + reserved + "" + JSON.stringify(give.reserve))
		return give.amount > reserved
	}
	
	return result
}

/// Actions to be applied when the target is reached
var TargetActions = 
{
	pick_container : function(creep, target) {},
	pick_creep : function(creep, target) {},
	pick_ground : function(creep, target) {},
	give_structure : function(creep, target)
	{
		return creep.servitor_transfer_structure(target)
	},
	give_creep : function(creep, target)
	{
		return creep.servitor_transfer_creep(target)
	},
}

function process_find_put(creep)
{
	/// And then find 'pick' targets 
	Memory.servitor_give = Memory.servitor_give || {}
	
	if(creep.carry.energy == 0)
	{
		creep.clearTarget()
		creep.setState('MoveGet')
		creep.say("Goget")
		return true
	}
	
	/// We fill spawn and tower first
	if(!creep.hasTarget())
	{
		//console.log(creep.name + " has no GIVE target")
		if( creep.find_closest_target(FIND_STRUCTURES, filter_structures, 'give_structure'))
		{
			var obj = Game.getObjectById(creep.memory.target)
			creep.log("transfering res to structure at " + obj.pos)
		}
		else if(creep.find_closest_target(FIND_MY_CREEPS, filter_creep_take, 'give_creep'))
		{
			var obj = Game.getObjectById(creep.memory.target)
			var rez = creep.carry.energy
			obj.room.servitor_reserve_give(obj, rez, Game.time)
			var name = "unknown"
			if(obj.name)
				name = obj.name
			creep.log("transfering res to object " + name + " at " + obj.pos)
		}
		else
		{
			creep.log("failed to find any GIVE target")
		}
	}
	
	if(creep.hasTarget()) 
	{
		creep.setState('MovePut')
		creep.say("Goput")
		return true
	}
	return false
}

function process_job(creep)
{
	creep.setState('MoveGet')
}
/** @param {Creep} creep **/
function process_move_get(creep)
{
	if(creep.carry.energy == creep.carryCapacity)
	{
		creep.setState('FindPut')
    	creep.say("Return")
	}
	/// Go mining
    if(!creep.memory.target)
    {
    	//console.log(creep.name + " moveget finding GIVE flag");
    	var filter = function (flag)
    	{
    		if(flag.memory.type != "servitor" || flag.memory.role != 'take')
    			return false
    		//console.log("consider TAKE " + flag.name + " reserved=" + flag.total_reserved() + " stored=" + flag.total_stored() + " " + JSON.stringify(flag.memory))
    		return flag.total_reserved(creep) < flag.total_stored()
    	}
    	
    	var target = creep.pos.findClosestByPath(FIND_FLAGS, { filter: filter } );
    	if(target)
    	{
    		creep.memory.target = target.name
    		target.reserve_task_flag(creep)
    	}
    	else
    	{
    		creep.log("No GIVE flag is found")
    	}
    }
    
    if(creep.memory.target)
    {
    	var obj = Game.flags[creep.memory.target]
    	if(!obj)
    	{
    		creep.clearTarget()
    		return false
    	}
    	//console.log(creep.name + " moveget moving to GIVE flag " + obj.name );
    	/// Check if target is dropped rez
    	if(creep.pos.getRangeTo(obj) <= 1)
    	{
    		//console.log(creep.name + " picking task flag" + obj.name );
    		creep.say("Pi"+ obj.name)
    		obj.pick_task_flag(creep)
    	}
    	else
    	{
    		//console.log(creep.name + " moving closer" + obj.name );
    		creep.say("Closer")
    		creep.moveTo(obj)
    	}
    }
    else if(creep.carry.energy > 0)
    {
    	creep.setState('FindPut')
    	creep.say("Return")
    }
}

function process_move_put(creep)
{
	var clear_target = false
	if(creep.hasTarget()) 
	{
		var action = TargetActions[creep.memory.action]
		if(!action)
		{
			console.log(creep.name + " has invalid action. Clearing target")
			clear_target = true
		}
		else
		{
			var object = Game.getObjectById(creep.memory.target)
			var result = action(creep, object)
			//console.log(creep.name + " applying action " + creep.memory.action)
			switch(result)
			{
			case OK:
				break;
			case ERR_NOT_IN_RANGE:
				creep.moveTo(object); 
				break;
			case ERR_FULL:
				creep.log("destination is full")
				clear_target = true
				break
			case ERR_INVALID_TARGET:
				creep.log("PUT target is invalid")
				clear_target = true
				break
			}
		}
	}
	else
	{
		clear_target = true
	}
	
	if(clear_target || creep.carry.energy == 0) 
	{
		//console.log(creep.name + " cleaning target data")
		creep.clearTarget()
		if(creep.carry.energy > 0)
			creep.setState('FindPut')
		else
			creep.setState('MoveGet')
		return true
	}
	return false
}



module.exports = new class extends CreepBase.Behaviour
{
    constructor()
    {
        super()    
    }
    
	role() 
	{
		return 'simple.servitor'
	}
	
	spawn(room) 
	{
		var tier = room.get_tech_tier()
		if(tier >= 3)
			return {
				name: 'SV', body : unpack_recipe({carry:8, move:8}), mem : {role:this.role(), tier : 3 }
			} 
		else if(tier == 2)
			return {
				name: 'SV', body : unpack_recipe({carry:5, move:5}), mem : { role:this.role(), tier: 2 }
			}	
		else
			return {
				name: 'SV', body : unpack_recipe({carry:3, move:3}), mem : {role:this.role(), tier : 1 }
			}
	}
	
	/// Return creep capabilities
	getCapabilities(creep)
	{		
		return { feed_spawn : 1, servitor : 1 }
	}
	
	get_desired_population(room)
	{
		var caps = room.get_capabilities()
		
		var result = 2
		///Servitors should be limited only by mine rate and travel distance
		if(caps.mine > 0)
			result += (caps.mine / 6)
		return Math.ceil(result)
	}
	
	/// Check servitor tasks
	check_tasks()
	{
		var tick = Game.time
		/// Check flags
		for(var f in Game.flags)
		{
			var flag = Game.flags[f]
			if(flag.memory.type != 'servitor')
				continue
			
			flag.update_task(true)
		}
		/// Check creeps
		for(var c in Memory.servitor_give)
		{
			var give_task = Memory.servitor_give[c]
			for(var rid in give_task.reserve)
			{
				var reserve = give_task.reserve[rid]
				if(reserve.time < tick)
					delete give_task.reserve[rid]
			}
		}
	}
	
	init(creep)
	{
		creep.overrideStates({
			MoveGet : process_move_get, 
			FindPut: process_find_put, 
			MovePut: process_move_put,
			Job:process_job
		})
	}
};