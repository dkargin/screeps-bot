/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('utils.action');
 * mod.thing == 'a thing'; // true
 */
 
var Mem = require('memory') 

/// Dictionary for action class instances
var ActionTypes = {}

/// Action execution/check result
var ActionResult = 
{
    Active : 0,     // Action is still active
    Complete : 1,   // Action is complete
    Failed : 2,     // Action has failed
    Canceled : 3,   // Action is canceled
    Broken : 4,     // Action data is broken
    Queued : 5,     // Action is queued
    Empty : 6,       // o action
    Rejected : 7,   // Action was rejected
}

/// Storage for action event handlers
/// Each event handler register itself in this table
/// To make it possible to restore event link after VM restart, both event caller 
/// and a handler keep unique event key. During 'restoration' process handler 
/// places again its function to this table
var ActionHandlers = {}

/// Call the event by specified hadler key
function raiseEvent(handler_key, data)
{
    var fn = ActionHandlers[handler_key]
    if(fn)
        fn(data)
}

/// Convert integer action check result to a string
function check2str(check)
{
    for(var str in ActionCheck)
        if(ActionCheck[str] == check)
            return str;
    return "Unknown action check result"
}

/// Generic template for all action types
/**
 * Memory layout
 *  - each action keeps a record in memory: Memory.actions[name]
 *  - unique name is generated using stored index, 
*/
class Action
{
    constructor()
    {
        this.memory.index = 0;
        ActionTypes[this.name()] = this
    }
    
    /// Attach an action to object or restore it
    /// We are supposing that action queue is stored at obj.memory.actions[]
    /// @param state
    attach(obj, state)
    {
    }
    
    /*
    /// Check if action can be completed
    check(target)
    {
        return ActionResult.Active
    }
    
    /// Return action name
    type(obj)
    {
        return "ActionTemplate"
    }
    
    active_name(obj)
    {
        return "ActionTemplate"
    }
    
    /// Called when task is complete, to clean up internal state
    clear(obj, data)
    {
    }
    */
    
    /// Called by behaviour to update its initial state
    /// @returns next update tick
    update(obj)
    {
        return 0
    }
}

Object.defineProperty(Action.prototype, 'memory', {
    get: function() {
        if(_.isUndefined(Memory.actions)) {
            Memory.actions = {};
        }
        if(!_.isObject(Memory.sources)) {
            return undefined;
        }
        return Memory.sources[this.name()] = Memory.sources[this.name()] || {};
    },
    set: function(value) {
        if(_.isUndefined(Memory.actions)) {
            Memory.actions = {};
        }
        if(!_.isObject(Memory.actions)) {
            throw new Error('Could not set source memory');
        }
        Memory.actions[this.name()] = value;
    }
});

/// Generic template for all action types
/*
var desc = {name:"mover", role:"mover", body:[]}
spawn.spawn(decs, link_event(self, ))
*/

class ActionSpawn extends Action
{
    constructor(obj, data, event)
    {
        super();
        
        data.action = this.prototype.name
        data.event = event
        console.log("Creating action="+this.prototype.name)
    }
    
    active_name(obj, data)
    {
        return "ActionTemplate"
    }
    
    /// Add recipt to a queue
    assign(obj, recipe, eventComplete, eventFailed)
    {
        this.memory.eventComplete = eventComplete
        this.memory.eventFailed = eventFailed
    }
    
    /// Check if action can be completed
    check(obj)
    {
        var body = recipe.body
        return ActionResult.Active
    }
    /// Called by behaviour to update its initial state
    /// @returns next update tick
    /// @param {StructureSpawn} obj - spawn
    update(obj)
    {
        return 0
    }
    
    /// Called when task is complete, to clean up internal state
    clear(obj)
    {
        
    }
}

/// MoveTo action
/// Guides creep to a stationary target
class MoveTo extends Action
{
    type()
    {
        return "MoveTo"
    }
    
    debug_name(obj, data)
    {
        return "MoveTo:" + data.target
    }
    
    // @param obj - object that will execute this action
    // @param targte - movement destination
    // @param finish - callback finction name. Will be called by obj[finish](...)
    assign(obj, data, target, finish)
    {
        data.action = name()
        data.action_move = 
        {
            target:target,  /// destination pos
            finish:finish,  /// event to be called when complete
            recalc:0        /// ticks for path recalculation
        }
    }
    
    info(obj)
    {
        return obj.memory.action_move
    }
    
    check(obj)
    {
        
    }
    
    update(obj)
    {
        return 0    
    }
    
    /// Remove action data from the creep
    /// Do not call it directly
    clear(obj)
    {
        delete obj.memory.action_move
    }
}

var MetaObjects = {}

class MetaObject
{
    constructor(name)
    {
        MetaObjects[name] = this
    }
    
    /// Register event handler.
    /// @returns event key
    event(handler)
    {
        return [this.id(), handler.name]
    }
}

Object.defineProperty(MetaObject.prototype, 'memory', {
    get: function() {
        if(_.isUndefined(Memory.mobjects)) {
            Memory.mobjects = {};
        }
        if(!_.isObject(Memory.mobjects)) {
            return undefined;
        }
        return Memory.mobjects[this.name] = Memory.mobjects[this.name] || {};
    },
    set: function(value) {
        if(_.isUndefined(Memory.mobjects)) {
            Memory.mobjects = {};
        }
        if(!_.isObject(Memory.mobjects)) {
            throw new Error('Could not set source memory');
        }
        Memory.mobjects[this.name] = value;
    }
});

module.exports =
{
    addType : function(type)
    {
        var name = type.name()
        ActionTypes[name] = type
    },
    /// Get action for specified type
    getType : function(type)
    {
        return ActionTypes[type]
    },
    update_task: function(obj)
    {
        if(!obj.memory.action)
        {
            return ActionResult.Broken
        }
        
        var action = this.getType(obj.memory.action)
        
        var status = action.check(obj)
        var exit = false
        switch(status)
        {
            case ActionResult.Broken:
                exit = true;
                break;
        }
    },
    
    /// Restore action from a memory
    restore : function(object)
    {
    	///TODO: implement
    },
    
    Spawn : ActionSpawn,    
    MetaObject : MetaObject,
    
    /// Add task to the queue
    taskqueue_add: function(obj, action)
    {
        obj.memory.action_queue = obj.memory.action_queue || []
        /* Example action queue:
         * action_queue = [
         * 		{action : TaskType, event : event_data, ...},
         * 		{action : TaskType, event : event_data, ...}
         * ]
         * TaskType - name of task class
         * event - data for raising task events
         * The rest of the fields contain task-specific data
         */
        obj.memory.action_queue.push(action)
        
        return action
    },
    /// Get first task
    taskqueue_first : function(obj)
    {
    	return obj.memory.action_queue[0]
    }
};

