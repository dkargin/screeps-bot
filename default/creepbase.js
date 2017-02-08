
/// Change current state
Creep.prototype.set_state = function(new_state)
{
	if(!this.get_state_handler(new_state))
	{
		throw(this.name + " switch to state without handler: " + new_state)
	}
	this.memory.state = new_state
	
	console.log(this.name + ' switched state to ' + new_state)
}

/// Get current state
Creep.prototype.get_state = function()
{
	return this.memory.state 
}

/// Get cached target position
Creep.prototype.get_target_pos = function()
{
	var raw_target = this.memory.target_pos
	return new RoomPosition(raw_target.x, raw_target.y, raw_target.roomName)
}

/// Return distance between room positions
function distance(pos1, pos2)
{
	if(pos1.roomName != pos2.roomName)
		return 50
	return Math.min(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y))
}

/// Get linear range to the object
Creep.prototype.rangeto = function(obj)
{
	return distance(this.pos, Game.getObjectPos(obj))
}
/// Check whether creep should move closer to a target
function check_should_move(creep)
{
	var target_pos = get_target_pos(creep)
}
/// Set target
Creep.prototype.set_target = function(target, action)
{
	this.memory.target = target.id
	
	var pos = target.pos
	this.memory.target_pos = {x:pos.x, y:pos.y, roomName:pos.roomName}
	
	if(action)
		this.memory.action = action
}

Creep.prototype.has_target = function()
{
	return ('target' in this.memory)
}

///FIND_STRUCTURES
Creep.prototype.find_closest_target = function (type, filter, action)
{
	this.clear_target()
	//console.log(this.name + " finding closest target of type " + type)
	var target = this.pos.findClosestByPath(type, {filter: filter});
	if(target)
	{
		this.set_target(target, action)
		return true
	}
	return false
}

Creep.prototype.clear_target = function()
{
	if('target' in this.memory)
		delete this.memory.target
		
	if('action' in this.memory)
		delete this.memory.action
	
	if('target_pos' in this.memory)
		delete this.memory.target_pos
}

/** Storage for custom state handlers
 * Maps unit id to overrides table 
 * 
**/ 
var CustomHandlers = {}


Object.defineProperty(Creep.prototype, 'custom_handlers', {
	get: function() 
	{
		if(!CustomHandlers[this.id])
			CustomHandlers[this.id] = {}
		
		return CustomHandlers[this.id];
    },
    set: function(value) {
    	CustomHandlers[this.id] = value
    }
});

/// Get method to handle current state
/// Tries to get creep's own override, and after global state handlers
Creep.prototype.get_state_handler = function(state)
{
	if(this.custom_handlers && this.custom_handlers[state])
	{
		return this.custom_handlers[state]
	}
	else
	{
		console.log("No override " + state + " is found for " + this.name + ": handlers=" + handlers_stringify(this.custom_handlers))
	}
	return States[state]
}

function handlers_stringify(handlers)
{
	var result = []
	for(var key in handlers)
	{
		result.push(key)
	}
	return JSON.stringify(result)
}

Creep.prototype.override_states = function(ov)
{	
	var handlers = this.custom_handlers
	for(var state in ov)
	{
//		console.log("Setting state=" + state)
		handlers[state] = ov[state]
	}
//	console.log("Overriden states for " + this.name + ": handlers=" + handlers_stringify(this.custom_handlers) + " src:" + handlers_stringify(ov))
}

/// Run single FSM step
///  returns whether we need to break FSM update cycle
Creep.prototype.fsm_step = function()
{
	var state = this.get_state()
	var handler = this.get_state_handler(state)
	if(!handler)
	{
		console.log(this.name + " has no handler for state " + state)
		this.set_state('Free')
		return true 
	}
	return handler(this)
}

Creep.prototype.process_fsm = function()
{
	//creep.get_capabilities = this.get_capabilities
    if(!('state' in this.memory))
    {
    	console.log("Implanting state to a creep")
    	this.set_state('Idle')
    }
    //if(Memory.debug && Memory.debug.simple_miner)
    	//
    //console.log("Processing " + this.name + " role=" + this.memory.role + " state=" + this.get_state())
    
    for(var i = 0; i < 3; i++)
    {
        if(!this.fsm_step())
        	break
    }
}

/** Process generic creep logic. After that switch to job logic **/
function process_idle(creep)
{
	/// Automatically switch to 'Job' state
	creep.set_state('Job')
}

function process_free(creep)
{
	console.log(creep.name + " role=" + creep.memory.role + " got default Free jandler")
	// Automatically switch to 'Job' state
	creep.set_state('Job')
	/// TODO: move to spawn[0] position
}

function process_job_dummy(creep)
{
	console.log(creep.name + " role=" + creep.memory.role + " got default Job jandler")
}


/** 
 * Table for all state types. Creeps either add new states here,
 * or rather add overrides to their local tables
**/
var States = 
{
	Idle : process_idle,
	Free : process_free,
	Job : process_job_dummy,
	Recycle : function(creep)
	{
		var filter = (obj) => obj.structureType == STRUCTURE_SPAWN;
		if(creep.find_closest_target(FIND_STRUCTURES, filter, 'recycle' ))
		{
			var obj = Game.getObjectById(creep.memory.target)
			if(creep.rangeto(obj) > 1)
				creep.moveTo(object);
			else
			{
				obj.recycle(creep)
				creep.room.servitor_take(creep.pos, 100)
			}
		}
	},
}

module.exports = 
{
	States : States,
	
	/// Base class for all behaviour processors
	/// Nothing especial here
	Behaviour : class 
	{
		get_capabilities() { throw "NotImplemented" }	// to be overriden
		
		init(creep) { throw "NotImplemented" }			// to be overriden
		
		run(creep, first) 
	    {
			creep.get_capabilities = this.get_capabilities
			this.init(creep)
			
	    	if(first || !creep.memory.initialized)
	    	{
	    		//console.log("!!!!!! Initializing first tick for " + creep.name)
				//this.init(creep)
				creep.memory.initialized = true
	    	}
	    	
	    	creep.process_fsm()
	    	//console.log("Global handlers=" + JSON.stringify(CustomHandlers))
	    }
	},
}