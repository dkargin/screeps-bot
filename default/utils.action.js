/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('utils.action');
 * mod.thing == 'a thing'; // true
 */
 
var ActionTypes = 
{
    
}

var ActionResult = 
{
    Active : 0,     // Action is still active
    Complete : 1,   // Action is complete
    Failed : 2,     // Action has failed
    Canceled : 3,   // Action is canceled
    Broken : 4,     // Action data is broken
    Empty : 5       // o action
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
class Action
{
    /// Return action name
    name()
    {
        return "ActionTemplate"
    }

    /// Called to restore 
    restore(obj) {}
    
    /// Get pretty action name, used for logging
    pretty_name(obj)
    {
        return "ActionTemplate"
    }
    
    /// Check if action can be completed
    check(target)
    {
        return ActionResult.Active
    }

    /// Called by behaviour to update its initial state
    /// @returns next update tick
    update(obj)
    {
        return 0
    }
    
    /// Called when task is complete, to clean up internal state
    clear(obj) {}
}

/// MoveTo action
/// Guides creep to a stationary target
class MoveTo extends Action
{
    name()
    {
        return "MoveTo"
    }
    
    debug_name(obj)
    {
        return "MoveTo:" + object.memory.target
    }
    
    // @param obj - object that will execute this action
    // @param targte - movement destination
    // @param finish - callback finction name. Will be called by obj[finish](...)
    assign(obj, target, finish)
    {
        
        obj.memory.action = name()
        obj.memory.action_move = 
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

class BuildUnit
{
	/// Return action name
    name()
    {
        return "ActionTemplate"
    }

    /// Called to restore 
    restore(obj)
    {

    }

    /// Create 
    assign(obj, design, on_complete, on_failed)
    {
    	
    }
    
    /// Get pretty action name, used for logging
    pretty_name(obj)
    {
        return "ActionTemplate"
    }
    
    /// Check if action can be completed
    check(target)
    {
        return ActionResult.Active
    }

    /// Called by behaviour to update its initial state
    /// @returns next update tick
    update(obj)
    {
        return 0
    }
    
    /// Called when task is complete, to clean up internal state
    clear(obj)
    {
        
    }
}
/// Generic action queue
class ActionQueue
{
    constructor(fn_get_queue)
    {
        this.get_queue = fn_get_queue
    }
}

module.exports = class
{
    addType(type)
    {
        var name = type.name()
        ActionTypes[name] = type
    }
    /// Get action for specified type
    getType(type)
    {
        return ActionTypes[type]
    }
    
    update_task(obj)
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
    }
    
    /// Restore action from a memory
    restore(object)
    {
        
    }
};