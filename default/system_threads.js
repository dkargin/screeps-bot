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
    for(var str in ActionResult)
        if(ActionResult[str] == check)
            return str;
    return "Unknown action check result"
}

/// All AI objects, that 
var EventHandlers = {}

class EventHandler
{
    constructor(uid)
    {
        EventHandlers[uid] = this     
        this._uid = uid
        this.last_event_handler = this.last_event_handler || 1 
    }
    
    uid()
    {
    	return this._uid
    }
    /// Register event handler.
    /// @returns event key
    makeHandler(handler)
    {
    	console.log("Making event handler uid="+this.uid() + " name=" + handler.name + " handler code="+handler)
        return [this.uid(), handler]
    }
    
    raise(handler, args)
    {
    	var fn = this[handler[1]]
    	console.log(this.constructor.name + " executing event from handler= "+ handler)
    	if(fn)
    		fn.apply(this, args)
    }
}

Object.defineProperty(EventHandler.prototype, 'memory', {
    get: function() {
        if(_.isUndefined(Memory.handlers)) {
            Memory.handlers = {};
        }
        if(!_.isObject(Memory.handlers)) {
            return undefined;
        }
        return Memory.handlers[this.name] = Memory.handlers[this.name] || {};
    },
    set: function(value) {
        if(_.isUndefined(Memory.handlers)) {
            Memory.mobjects = {};
        }
        if(!_.isObject(Memory.handlers)) {
            throw new Error('Could not set source memory');
        }
        Memory.handlers[this.name] = value;
    }
});

/// Generic template for all action types
/**
 * Memory layout
 *  - each action keeps a record in memory: Memory.actions[name]
 *  - unique name is generated using stored index, 
*/
class Action
{
    constructor(name)
    {
        ActionTypes[name] = this
    }
    
    /// Attach an action to object or restore it
    /// We are supposing that action queue is stored at obj.memory.actions[]
    /// @param state
    attach(obj, state)
    {
    }
    
    /// Get attached memory
    get_data(obj)
    {
    	return obj.memory.actions[this.active_name()]
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
    constructor()
    {
        super('ActionSpawn');
        /*
        data.action = this.prototype.name
        data.event = event
        console.log("Creating action="+this.prototype.name)
        */
    }
    
    active_name(obj, data)
    {
        return "ActionTemplate"
    }
    
    /// Add recipt to a queue
    attach(obj, data, recipe, event)
    {
        data.event = event
        data.recipe = recipe
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

/// Dummy action
class ActionWait extends Action
{
    constructor()
    {
        super('ActionWait');
    }
    
    attach(obj, data, duration, event)
    {
        data.event = event
        data.duration = duration
        console.log("Created "+this.constructor.name+" duration="+data.duration + " event=" + event)
    }
    /*
    active_name(obj, data)
    {
        return "AcionWait"
    }*/
    
    /// Check if action can be completed
    check(obj, data)
    {
    	console.log("ActionWait checks its state, left="+data.duration)
        return ActionResult.Active
    }
    /// Called by behaviour to update its initial state
    /// @returns next update tick
    /// @param {StructureSpawn} obj - spawn
    update(obj, data)
    {
    	data.duration--
    	
    	if(data.duration > 0)
    		return ActionResult.Active
    	return ActionResult.Complete
    }
    
    raise(obj, data, result)
    {
    	var event = data.event
    	var handler = EventHandlers[event[0]]
    	if(!handler)
    	{
    		console.log(this.name + "@" + obj.name + " failed to find handler="+event[0])
    		return
    	}
    	
    	handler.raise(event, [result])
    }
    
    /// Called when task is complete, to clean up object internal state
    clear(obj)
    {
        
    }
}
/// MoveTo action
/// Guides creep to a stationary target
class MoveTo extends Action
{
	constructor()
	{
		super('MoveTo')
	}
	
    debug_name(obj, data)
    {
        return "MoveTo:" + data.target
    }
    
    // @param obj - object that will execute this action
    // @param targte - movement destination
    // @param finish - callback finction name. Will be called by obj[finish](...)
    assign(obj, data, target, event)
    {
        data.action = this.name
        data.target = target
        data.event = event
        data.status = 0
        data.recalc = 0
    }
    
    check(obj, data)
    {
        return ActionResult.Active
    }
    
    update(obj, data)
    {
        return 0    
    }
    
    /// Remove action data from the creep
    /// Do not call it directly
    clear(obj)
    {
    }
}

/// Table of active threads
var ActiveThreads = 
{
}

class ThreadManager 
{
	/**
	 * Add new thread
	 */
	start_thread(thread_fn, priority)
	{
		
	}
	init_types()
	{
		this.addType(new ActionSpawn())
		this.addType(new ActionWait())
		this.addType(new MoveTo())
	}
	
    addType(type)
    {
        ActionTypes[type.name] = type
    }
    /// Get action for specified type
    getType(type)
    {
        return ActionTypes[type]
    }
    
   // Spawn : ActionSpawn,    
   // EventHandler : EventHandler,
    
    addTaskWait(obj, duration, event)
    {
    	var action = ActionTypes.ActionWait
    	//console.log("CName="+action.constructor.name + " AName=" + action.name)
    	var data = {action : action.constructor.name}
    	action.attach(obj, data, duration, event)
    	this.taskqueue_add(obj, data)
    }
    /// Add task data to the queue
    taskqueue_add(obj, data)
    {
    	if(!data.action)
    	{
    		console.log("Invalid action name is added to the queue")
    		return
    	}
    	console.log("Adding action=" + data.action + " to the queue")
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
        obj.memory.action_queue.push(data)
    }
    /// Get first task
    taskqueue_first(obj)
    {
    	return obj.memory.action_queue[0]
    }
    
    /// Pop first action from action queue
    taskqueue_pop(obj)
    {
    	if(obj.memory.action_queue.length == 0)
    		return
    	var action_data = obj.memory.action_queue[0]
    	var action = ActionTypes[action_data.action]
    	if(action)
    	{
    		console.log("Popping action " + action.name + " from queue")
    		if(action.raise)
    			action.raise(obj, action_data, ActionResult.Canceled)
    		if(action.clear)
    			action.clear(obj)
    	}
    	obj.memory.action_queue.shift()
    }
    
    taskqueue_clear(obj)
    {
    	while(obj.memory.action_queue.length > 0)
		{
    		this.taskqueue_pop(obj)
		}
    }
    
    /// Get task queue length
    taskqueue_length(obj)
    {
    	return obj.memory.action_queue.length
    }
    
    /// Process task queue
    taskqueue_process(obj)
    {
    	if(obj.memory.action_queue.length == 0)
    		return
    		
		var action_data = this.taskqueue_first(obj)
		var action = ActionTypes[action_data.action]
    	
		var check_result = action.update(obj, action_data);
    	var str_result = check2str(check_result)
    	
    	console.log("taskqueue_process action "+ action_data.action + " with data=" + JSON.stringify(action_data) + " state="+str_result)
		switch(check_result)
		{
		case ActionResult.Active : 		// Action is still active			
			//action.update(obj, action_data)
			break
		case ActionResult.Complete : 	// Action is complete
		case ActionResult.Failed : 		// Action has failed
		case ActionResult.Canceled : 	// Action is canceled
		case ActionResult.Broken :
		case ActionResult.Empty : 		// faulty action
			action.raise(obj, action_data, check_result)
			action.clear(obj)
			obj.memory.action_queue.shift()
			break;     // Action data is broken
		//case ActionResult.Queued : break;     // Action is queued
		//case ActionResult.Rejected : break   // Action was rejected
		default:
			console.log("tasqueue_process: unprocessed check result="+check_result)
		}
    }
}

module.exports = new ThreadManager();

var tick = 0

function test_event()
{
    testCorp.executed = false
    var event = testCorp.makeHandler('event0')
    
    testCorp.raise(event)
    if(!testCorp.executed)
    {
        console.log("<b>Failed to run event handler!!!</b>")
        return false
    }
    return true
}

function test_action_queue()
{
	var obj = Game.spawns.Spawn1
	
	/// Initialize default action types
	if(tick == 0)
	{
	    if(!test_event())
	        return
	
		console.log("<b> ======================Initializing action test =================</b>")
		Actions.init_types()
		
		Actions.taskqueue_clear(obj)
		
		Actions.addTaskWait(obj, 3, testCorp.makeHandler('event1'))
		Actions.addTaskWait(obj, 7, testCorp.makeHandler('event2'))
		Actions.addTaskWait(obj, 5, testCorp.makeHandler('event3'))
		Actions.addTaskWait(obj, 8, testCorp.makeHandler('event3'))
	}
	
	Actions.taskqueue_process(obj)
	
	if(tick > 24)
	{
		if(Actions.taskqueue_length(obj) != 0)
			console.log("!!!Task queue is not empty!!!")
	}
	
	tick = tick + 1
}

/*
var testCorp = new Actions.EventHandler("test_corp")

testCorp.event0 = function(event, result)
{
    this.executed = true
	console.log("testCorp executed event")
}


testCorp.event1 = function(event, result)
{
	console.log("<h>Event1 result=</h>" + Actions.resultToString(result))
}

testCorp.event2 = function(event, result)
{
	console.log("<h>Event2 result=</h>" + Actions.resultToString(result))	
}

testCorp.event3 = function(event, result)
{
	console.log("Event3 result=" + Actions.resultToString(result))	
}
*/


/*
 * General ideas:
 * - Each thread spins once per game tick
 * - If CPU is exausted, then some threads are preempted. Run queue is calculated based on thread priority
 * - Effective priority = (ticks_from_last_update * priority)
 * - Each thread has 'path', a string name, used to find thread's persistent memory
 * - Thread can spawn 'children' threads. Their names are generated from parent path
 * Thread types:
 * - spinner. Spins once per tick
 * - task. Does some calculation task
 */


/// Thread context
/// Wraps some sort of generator
class Context
{
    constructor(generator, path, opts)
    {
        this.generator = generator
        this.priority = opts.priority || 10
        this.path = path
        /// Last updated tick
        this.last_tick = Game.time
    }

    /// Calculates current thread priority
    effective_priority(tick)
    {
        return this.priority * (tick - this.last_tick)
    }
    /// Check if thead is complete for current tick
    complete(tick)
    {
        return this.last_tick == tick
    }

    /// Spin generator once
    spin_once(tick)
    {
        var result = this.generator.next()
        this.last_tick = tick
        return result.done
    }
}

/// Thread scheduler
brain.scheduler = new class
{
    constructor()
    {
        this.tick_queue = []
    }

    update()
    {

    }
}

/// Finds thread by name or pid
brain.find_thread = function(name_or_pid)
{
    /// TODO: implement
}


/// Update all threads
brain.update_threads = function()
{
    var tick = Game.time
    /// List of threads to be run
    var spawn = []
    /// 1. Fill in thread spawn
    for(var t in brain.threads)
    {
        spawn.push(brain.threads[t])
    }

    /// 2. Sort threads using local priority
    spawn.sort((thread) => thread.effective_priority(tick))

    /// 3. Run thread spawn until CPU is exausted
    for(var t in spawn)
    {
        var thread = spawn[t]
        thread.spin_once(tick)
        /// TODO: stop when CPU is exhausted
    }
}
/*
thread info
- last update tick
- 
*/
/// Creates thread from generator and specified path
brain.create_thread = function(generator, path, opts = {})
{
    /// opts.priority = number
    /// opts.restart = 

    /// 1. Generate new pid
}


/*

Thread types:

- single large task. Runs until it is complete. Such task can be 
- event is called every tick


CPU Management:

1. Pick threads from lowest priority to highest

*/
