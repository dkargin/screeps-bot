// Behaviour table. Maps creep.behaviour to a specific class handler
global.Behaviours = {}

global.list_behaviours = function()
{
    var result = "{"
    for(var i in Behaviours)
    {
        result += (i + "=" + Behaviours[i] + ";")
    }
    return result + "}"
}

/// Change current state
Creep.prototype.setState = function(new_state)
{
	if(!this.getStateHandler(new_state))
	{
		throw(this.name + " switch to state without handler: " + new_state)
	}
	this.memory.state = new_state
	
	//console.log(this.name + ' switched state to ' + new_state)
}

// Get current state. This state is stored in the memory
Creep.prototype.getState = function()
{
	return this.memory.state 
}

Creep.prototype.log = function(msg)
{
    
}

// Get cached target position
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

// Get behaviour
Creep.prototype.getBehaviour = function()
{
    return _.get(global.Behaviours, this.memory.role)
}

Creep.prototype.getCapabilities = function()
{
    var behaviour = this.getBehaviour();
    if (behaviour)
        return behaviour.getCapabilities(this);
    else
    {
        throw new Error("No behaviour for creep name=" + this.name + " role=" + this.memory.role + "\n Behaviours=" + list_behaviours())
    }
    return null
}

/// Check whether creep should move closer to a target
function check_should_move(creep)
{
	var target_pos = get_target_pos(creep)
}
/// Set target
Creep.prototype.setTarget = function(target, action)
{
	this.memory.target = target.id
	
	var pos = target.pos
	this.memory.target_pos = {x:pos.x, y:pos.y, roomName:pos.roomName}
	
	if(action)
		this.memory.action = action
}

Creep.prototype.hasTarget = function()
{
	return ('target' in this.memory)
}

///FIND_STRUCTURES
Creep.prototype.find_closest_target = function (type, filter, action)
{
	this.clearTarget()
	//console.log(this.name + " finding closest target of type " + type)
	var target = this.pos.findClosestByPath(type, {filter: filter});
	if(target)
	{
		this.setTarget(target, action)
		return true
	}
	return false
}

Creep.prototype.clearTarget = function()
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
Creep.prototype.getStateHandler = function(state)
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

Creep.prototype.overrideStates = function(ov)
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
Creep.prototype.fsmStep = function()
{
	var state = this.getState()
	var handler = this.getStateHandler(state)
	if(!handler)
	{
		console.log(this.name + " has no handler for state " + state)
		this.set_state('Free')
		return true 
	}
	return handler(this)
}

/** Process generic creep logic. After that switch to job logic **/
function process_idle(creep)
{
	/// Automatically switch to 'Job' state
	creep.setState('Job')
}

function process_free(creep)
{
	console.log(creep.name + " role=" + creep.memory.role + " got default Free jandler")
	// Automatically switch to 'Job' state
	creep.setState('Job')
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
	    constructor()
	    {
	        var r = this.role()
	        Behaviours[r] = this
	        console.log("Behaviour for role=" + r + " is done")
	    }
	    
		getCapabilities() { throw new Error("NotImplemented") }	// to be overriden
		
		init(creep) { throw new Error("NotImplemented") }			// to be overriden
		
		run(creep, first) 
	    {
	        if (!(creep instanceof Creep))
	            throw new Error("Behaviour.run("+creep + ") - invalid object provided")
	            
	    	if(first || _.get(creep.memory, 'session') != get_session_id())
	    	{
	    	    this.init(creep)
				creep.memory.session = get_session_id()
	    	}
	    	
	    	
	    	// Spin creep's FSM 
	    	if(!('state' in creep.memory))
            {
            	console.log("Implanting state to a creep")
            	creep.setState('Idle')
            }
            
            for(var i = 0; i < 1; i++)
            {
                if(!creep.fsmStep())
                	break
            }
	    }
	},
}