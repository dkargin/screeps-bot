'use strict'
/*
 * Module contains memory utilities at system level
 */

global.OS = global.OS || {}

/// Init volatile cache. Should we do it here?
_.defaults(OS, {
    threads : {},
    /// Why do we need cache here?
    cache:
    {
        rooms: {},
        corporations : {},
        creeps: {},
        sources: {},
    },
})

OS.print_memory = function(path)
{
    var data = brain
    var str = JSON.stringify(str)
    console.log("OS data for path " + path + " = " + data)
}

/// @param objects - array of object ids
/// @returns array of objects that are still alive
/// Implants 'memory' property to an object
global.implant_memory = function(classname, location, gid)
{
    if(!gid)
        gid = (obj) => obj.id

    try
    {
        Object.defineProperty(classname, 'memory', 
        {
            get: function() {
                if(_.isUndefined(Memory[location])) {
                    Memory[location] = {};
                }
                if(!_.isObject(Memory[location])) {
                    return undefined;
                }
                return Memory[location][gid(this)] = Memory[location][gid(this)] || {};
            },
            set: function(value) {
                if(_.isUndefined(Memory[location])) {
                    Memory[location] = {};
                }
                if(!_.isObject(Memory[location])) {
                    throw new Error('Could not implant memory for class ' + classname.name);
                }
               Memory[location][gid(this)] = value;
            },
            configurable: truem
        });
    }
    catch(ex)
    {
        
    }
}

/// Implants 'cache' property to an object
global.implant_cache = function(classname, location)
{
    Object.defineProperty(classname, 'cache', {
        get: function() {
            if(_.isUndefined(brain.cache[location])) {
                brain.cache[location] = {};
            }
            if(!_.isObject(brain.cache[location])) {
                return undefined;
            }
            return brain.cache[location][this.id] = brain.cache[location][this.id] || {};
        },
        set: function(value) {
            if(_.isUndefined(brain.cache[location])) {
                brain.cache[location] = {};
            }
            if(!_.isObject(brain.cache[location])) {
                throw new Error('Could not implant cache for class ' + classname.name);
            }
           brain.cache[location][this.id] = value;
        },
        configurable: true
    });
}
/*
Game.check_alive = function(objects)
{
    var alive = []
    for(var i in objects)
    {
        var obj = Game.getObjectById(objects[i])
        if(obj)
            movers.push(ob)
    }
    return alive
}*/

// Local function to initialize OS memory
function memory_init()
{
    console.log("Initializing BOT memory")

    OS.start_tick = Game.time
    
    implant_memory(Source.prototype, '_sources');
    implant_memory(StructureContainer.prototype, '_containers');
    implant_memory(StructureStorage.prototype, '_storages');
    implant_cache(Creep.prototype, '_creeps')
    implant_cache(Flag.prototype, '_flags')

    /*
    Object.defineProperty(Source.prototype, 'memory', {
        get: function() {
            if(_.isUndefined(Memory._sources)) {
                Memory._sources = {};
            }
            if(!_.isObject(Memory._sources)) {
                return undefined;
            }
            return Memory._sources[this.id] = Memory._sources[this.id] || {};
        },
        set: function(value) {
            if(_.isUndefined(Memory._sources)) {
                Memory._sources = {};
            }
            if(!_.isObject(Memory._sources)) {
                throw new Error('Could not set source memory');
            }
            Memory._sources[this.id] = value;
        }
    });


    Object.defineProperty(StructureContainer.prototype, 'memory', {
        get: function() {
            if(_.isUndefined(Memory._containers)) {
                Memory._containers = {};
            }
            if(!_.isObject(Memory._containers)) {
                return undefined;
            }
            return Memory._containers[this.id] = Memory._containers[this.id] || {};
        },
        set: function(value) {
            if(_.isUndefined(Memory._containers)) {
                Memory._containers = {};
            }
            if(!_.isObject(Memory._containers)) {
                throw new Error('Could not set source memory');
            }
            Memory._containers[this.id] = value;
        }
    });


    Object.defineProperty(StructureStorage.prototype, 'memory', {
        get: function() {
            if(_.isUndefined(Memory._storages)) {
                Memory._storages = {};
            }
            if(!_.isObject(Memory._storages)) {
                return undefined;
            }
            return Memory.storages[this.id] = Memory._storages[this.id] || {};
        },
        set: function(value) {
            if(_.isUndefined(Memory._storages)) {
                Memory._storages = {};
            }
            if(!_.isObject(Memory._storages)) {
                throw new Error('Could not set source memory');
            }
            Memory._storages[this.id] = value;
        }
    });*/

    Memory.settings = Memory.settings || {}
}

OS.memory_clean = function()
{
    // Should do cleanup for tracked memory resources
    for(var i in Memory.creeps)
    {
        if(!Game.creeps[i]) {
            delete Memory.creeps[i];
        }
    }
    
    for(var i in Memory._storages)
    {
        var obj = Game.getObjectById(i)
        if(!obj)
            delete Memory._storages[i]
    }

    for(var i in Memory.flags)
    {
        var flag = Game.flags[i]
        if(!flag)
            delete Memory.flags[i]
    }
}

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
/// Wraps some sort of a generator
class ThreadContext
{
    constructor(generator, path, opts)
    {
        this.generator = generator
        this.priority = opts.priority || 10
        this.path = path
        this.status = 0
        /// Last updated tick
        this.last_tick = 0  //Game.time
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

var thread_by_path = {}
var thread_by_pid = {}
var free_pids = []
var last_pid = 1

// OS.threads should contain map /path -> Context
// Run scheduled threads
function schedule_threads()
{
    // Just run all threads once
    // TODO: Implement a better scheduler here
    
    var cpu_start = Game.cpu.getUsed()
    var cpu_limit = Game.cpu.limit
    
    // A list of thread to be removed
    var dead_threads = []
    
    var tick = Game.time
    /// List of threads to be run
    var spawn = []
    /// 1. Fill in thread spawn
    for(var t in thread_by_path)
    {
        spawn.push(thread_by_path[t])
    }

    /// 2. Sort threads using local priority
    spawn.sort((thread) => thread.effective_priority(tick))

    var threads_iterated = 0

    /// 3. Run thread spawn until CPU is exausted
    for(var t in spawn)
    {
        var thread = spawn[t]
        try
        {
            var gen = thread.generator
            var result = generator.next()
            
            if (result instanceof SysRequest)
            {
                
            }
            thread.last_tick = tick
            // TODO: Accumulate statistics in memory
            threads_iterated++
        }
        catch(ex)
        {
            console.log("Error running thread \""+thread.path+"\": " + ex);
            console.log("stack: " + ex.stack)
        }
        /// TODO: stop when CPU is exhausted
    }
    
    for(i in dead_threads)
    {
        // TODO: delete it
    }
}


/// Finds thread by name or pid
OS.find_thread = function(name_or_pid)
{
    /// TODO: implement
    
}

/*
thread info
- last update tick
- 
*/

var ThreadType = 
{
    Invalid : 0,
    Generator : 1,      
    Loop : 2,
}

/// Action execution/check result
OS.ThreadState = 
{
    Active : 0,         // Action is still active
    Done: 1,            // Thread has exited/joined
    WaitForResource: 2, // Thread is waiting for resource
    Queued : 5,         // Action is queued
    Empty : 6,          // o action
    Rejected : 7,       // Action was rejected
}

/// Simplest generator of new PID
function generate_new_pid()
{
    var pid = last_pid || 1
    last_pid = pid + 1
    return pid
}

/// Creates thread from generator and specified path
OS.create_thread = function(generator, path, opts = {})
{
    /// Path - 
    /// opts.priority = number
    /// opts.restart = 

    // Check if specified path is occupied
    if(path in thread_by_path)
    {
        var prev_thread = thread_by_path[path]
        console.log("WARNING: Thread \'" + path + "\' already exists ")
    }
    
    /// 1. Generate new pid
    var pid = generate_new_pid()
    var tc = new ThreadContext(generator, path, opts)
    tc.pid = pid
    
    /// Registering thread
    thread_by_pid[pid] = tc
    thread_by_path[path] = tc
    
    console.log("Created thread \'" + path + "\' with pid="+pid)
    /// TODO: Maybe we should kick scheduler
    
    return pid
}

OS.create_loop = function(fn, path, opts = {})
{
    if (!_.isFunction(fn))
    {
        console.log("create_loop("+path+": should give a function")
        return 0
    }
    var generator = function*()
    {
        fn()
    }
    return this.create_thread(generator(), path, opts)
}

var firstTick = true

/// Used in main as initializer for an OS
OS.default_run = function(start_method)
{
    if(firstTick)
    {
        console.log("<b> ====================== Script has restarted at tick " + Game.time + " =================</b>")
        memory_init()
        // This should be some sort of a thread?
        start_method()
        
        firstTick = false
        console.log("<b> ====================== Script initialization is done  =================</b>")
    }
    
    try
    {
        schedule_threads()
        OS.memory_clean()
        
        var used = Game.cpu.getUsed() 
        if(used > 10)
        {
        	console.log("WARNING: CPU spike=" + used + " detected at tick " + Game.time)
        }
    }
    catch(ex)
    {
        console.log("EXCEPTION: main loop got exception: " + ex)
        console.log("stack: " + ex.stack)
    }
}

/**
 * Possible API, accessible through yieldt:
 * break()
 * sleep(ticks)
 * thread_info()
 * wait_for(path)
 * create_thread()
 * create_loop()
 */

/**
 * Thread statistics:
 *  - runs_count
 *  - fail_count
 *  - last_status
 */ 
/// This is the example foe OS thread
/// We do thread testing for this
var test_thread = function *(arg1, arg2)
{
    var name = "noname"
    
    var info = yield OS.thread_info()
    var name = info.path || "noname"
    
    console.log("Entered thread " + name)
    
    yield OS.break("Stop at step 1")

    console.log("Doing step2 with arg="+arg1 + " arg2="+arg2)
    yield OS.break("Stop at step 2")

    return "Complete"
}


module.exports = OS;