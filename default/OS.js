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

var OS_LOG_FATAL = 5
var OS_LOG_ERROR = 4
var OS_LOG_INFO = 3
var OS_LOG_DEBUG = 2
var OS_LOG_VERBOSE = 1

function log_suffix(level)
{
    switch(level)
    {
        case OS_LOG_FATAL: return "FATAL";
        case OS_LOG_ERROR: return "ERROR";
        case OS_LOG_INFO: return "INFO";
        case OS_LOG_DEBUG: return "DEBUG";
        case OS_LOG_VERBOSE: return "VERBOSE";
        default: return "";
    }
}

var thread_by_path = {}
var thread_by_pid = {}
var free_pids = []
var last_pid = 1
var firstTick = true

OS.logLevel = OS_LOG_INFO

OS.log = function(level, text)
{
    if(this.logLevel <= level)
        console.log("OS:" + log_suffix(level) + ": " + text)
}

OS.log_info = function(text)
{
    this.log(OS_LOG_INFO, text)
}

OS.log_error = function(text)
{
    this.log(OS_LOG_ERROR, text)
}

OS.log_debug = function(text)
{
    this.log(OS_LOG_DEBUG, text)
}

// OS Sessing identifier. Incremented every new start
// We use it for tracking some kernel objects, that are 
// belonging to previous session.
var current_session_id = 0

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
    OS.log_info("Initializing BOT memory")

    _.defaults(Memory.os, {session_id: 0, last_start_tick: 0})
    
    Memory.os.session_id = Memory.os.session_id + 1
    current_session_id = Memory.os.session_id
    
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


/// Not sure we need a separate enum, instead of a function
var CommandType = 
{
    CreateThread: 1,
    Sleep: 2,
    Break: 3,
    Wait: 4,
    Acquire: 5,
    Release: 6,
    GetSelf: 7,
    FinishTick: 8,
};

var ThreadState = 
{
    Initial: 0,
    Waiting: 1,     // Waitint to be scheduled
    Running: 2,     // Running right now
    Done: 3,        // Thread has exited
    SysCall: 4,     // Interrupted by a system call
    Exception: 5,
    DoneTick: 6,    // Thread has completed its cycle, and can be scheduled only at the next iteration
};

/// System command.
/// Every yield.OS should return this object
class SysCommand
{
    constructor(command, args)
    {
        this.command = command
        this.args = args
    }
}


/// Thread context
/// Wraps some sort of a generator
class ThreadContext
{
    constructor(parent, generator, path, opts)
    {
        this.generator = generator
        this.priority = opts.priority || 10
        this.path = path
        this.state = 0
        /// Last updated tick
        this.last_tick = 0  //Game.time
        this.loop = opts.loop || false
        if (this.loop)
            OS.log_debug("thread " + path + " will be a loop function")
        this.pid = 0
        this.session_id = 0
        this.parent_ = parent
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
    
    get_state()
    {
        return this.state
    }
}

function spin_thread(thread, tick)
{
    OS.log_debug("Spinning thread " + style_os_symbol(thread.path) + " at tick " + style_os_symbol(tick));
    var result
    
    if (!(thread instanceof ThreadContext))
        throw("OS: Can spin threads only")
    
    var state = thread.get_state()
    switch(state)
    {
        case ThreadState.Initial:
            OS.log_debug("thread " + style_os_symbol(thread.path) + " is in initial state. Running until the first interrupt");
            result = thread.generator.next()
            break;
            
        case ThreadState.DoneTick:
        case ThreadState.SysCall:
            //console.log("Thread \"" + thread.path + "\" is being restored from system interrupt.");
            var os_result = thread.os_result
            thread.os_result = null
            result = thread.generator.next(os_result)
            break;
        default:
            throw("Unhandled state for the thread=" + state)
    }
    
    if (!result)
    {
        thread.state = ThreadState.Exception
        throw("Generator should return something good")
    }
    else if (result.done)
    {
        OS.log_info("thread " + style_os_symbol(thread.path) + " has exited smoothly");
        thread.state = ThreadState.Done
    }
    else
    {
        var signal = result.value
        if (signal instanceof SysCommand)
        {
            thread.state = ThreadState.SysCall;
            
            switch(signal.command)
            {
                case CommandType.CreateThread:
                    OS.log_debug("thread " + style_os_symbol(thread.path) + " is interrupted by command CreateThread");
                    //[generator, path, opts]
                    var newThread = create_thread_impl(thread, ...signal.args)
                    thread.os_result = newThread.pid
                    break;
                /*
                case CommandType.Sleep:break;
                case CommandType.Break:break;
                case CommandType.Wait:break;
                case CommandType.Acquire:break;
                case CommandType.Release:break;
                */
                case CommandType.GetSelf:
                    OS.log_debug("thread \"" + thread.path + "\" is interrupted by command GetSelf");
                    thread.os_result = thread;
                    break;
                case CommandType.FinishTick:
                    thread.state = ThreadState.DoneTick;
                    thread.os_result = true;
                    break;
                default:
                    os.log_error("thread \"" + thread.path + "\" is interrupted by an unhandled system command=" + signal.command);
                    break;
            }
        }
        else
        {
            os.log_error("Thread \"" + thread.path + "\" has yielded to unknown " + (typeof signal));
        }    
    }
    
    thread.last_tick = tick
    return true;
}

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
        var thread = thread_by_path[t]
        //console.log("OS: thread \""+thread.path+"\" status="+thread.get_state());
        switch(thread.get_state())
        {
            case ThreadState.Done:
                OS.log_debug("thread " + style_os_symbol(thread.path) + " is in Done state - deleting it");
                dead_threads.push(thread)
                break;
            case ThreadState.Exception:
                OS.log_debug("thread "+ style_os_symbol(thread.path) + " is in Error state - deleting it");
                dead_threads.push(thread)
                break;
            case ThreadState.DoneTick:
                if (thread.last_tick != tick)
                {
                    spawn.push(thread)
                }
                break;
            default:
                spawn.push(thread)
                break;
        }   
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
            if (spin_thread(thread, tick))
                threads_iterated++
        }
        catch(ex)
        {
            thread.state = ThreadState.Exception
            OS.log_error("Error running thread "+style_os_symbol(thread.path)+": " + ex + "\n" + ex.stack);
        }
    }
    
    for(var i in dead_threads)
    {
        // TODO: delete it
        var thread = dead_threads[i]
        remove_thread(thread)
    }
    
    return threads_iterated
}


/// Finds thread by name or pid
/// It returns copied thread info
OS.find_thread = function(name_or_pid)
{
    /// TODO: implement
    
}

/// Simplest generator of new PID
function generate_new_pid()
{
    var pid = last_pid || 1
    last_pid = pid + 1
    return pid
}

function get_session_id()
{
    return current_session_id;
}

// Cleans up all references from the thread
function remove_thread(thread)
{
    OS.log_debug("OS: removing thread " + style_os_symbol(thread.path))
    var path = thread.path
    if (path && path in thread_by_path)
        delete thread_by_path[path]
        
    var pid = thread.pid
    if (pid && pid in thread_by_pid)
        delete thread_by_pid[pid]
        
    // TODO: Remove it from current spawn
}

function style_os_symbol(text)
{
    return "<b><font color=\"green\">"+text+"</font></b>"
}

/// Creates thread from generator and specified path
function create_thread_impl(parent, generator, path, opts = {})
{
    if (parent && !(parent instanceof ThreadContext))
        throw("create_thread_impl parent should be a thread or null")
        
    if (typeof(path) != 'string')
        throw("create_thread_impl path should be a string")
    /// Path - 
    /// opts.priority = number
    /// opts.restart = 

    // Check if specified path is occupied
    if(path in thread_by_path)
    {
        var prev_thread = thread_by_path[path]
        if (prev_thread.session_id == get_session_id())
        {
            OS.log_error("Thread \'" + style_os_symbol(path) + "\' already exists ")
            return 0
        }
        else
        {
            OS.log_debug("Recycling thread \'" + style_os_symbol(path) + "\' from the previous session ")
            remove_thread(prev_thread)
        }
    }
    
    /// 1. Generate new pid
    var pid = generate_new_pid()
    var tc = new ThreadContext(parent, generator, path, opts)
    tc.pid = pid
    tc.session_id = get_session_id()
    
    /// Registering thread
    thread_by_pid[pid] = tc
    thread_by_path[path] = tc
    
    var parent_path = "none"
    if (parent && parent.path)
        parent_path = parent.path
    OS.log_info("Created thread " + style_os_symbol(path) + " with pid=<b>"+style_os_symbol(pid) + "</b> parent_path=<b>" + style_os_symbol(parent_path) + "</b> loop=" + style_os_symbol(tc.loop))
    
    return tc
}


OS.create_thread = function*(generator, path, opts = {})
{
    //console.log("create_thread("+path+"): creating child thread")
    var pid = yield new SysCommand(CommandType.CreateThread, [generator, path, opts])
    return pid
}

OS.create_loop = function*(fn, path, opts = {})
{
    if (!_.isFunction(fn))
    {
        OS.log_error("create_loop("+style_os_symbol(path)+": should give a function")
        return 0
    }
    
    var generator = function*()
    {
        //console.log("create_loop("+path+"): started loop wrapper")
        do
        {
            fn()
        }while(yield* OS.finishTick());
        OS.log_debug("create_loop("+style_os_symbol(path)+"): finished loop wrapper")
    }
    
    opts.loop = true
    //console.log("create_loop("+path+"): calling create_thread")
    var pid = yield* OS.create_thread(generator(), path, opts)
    return pid
}

OS.finishTick = function*()
{
    return yield new SysCommand(CommandType.FinishTick, [])
}

OS.this_thread = function*()
{
    return yield new SysCommand(CommandType.GetSelf, [])
}

OS.break = function*()
{
    return yield new SysCommand(CommandType.Break, [])
}

/// Used in main as initializer for an OS
function os_default_run(start_method)
{
    if(firstTick)
    {
        console.log("<b> ====================== Script has restarted at tick " + Game.time + " =================</b>")
        memory_init()
        
        // This should be some sort of a thread?
        create_thread_impl(null, start_method, 'bootloader')
        
        firstTick = false
        console.log("<b> ====================== Script initialization is done  =================</b>")
    }
    
    var threshold = 0.5
    
    try
    {
        var startCpu = Game.cpu.getUsed() 
        while(schedule_threads() > 0)
        {
            var currentCpu = Game.cpu.getUsed()
            if (currentCpu > Game.cpu.limit * threshold)
                break;
        }
        
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


module.exports = os_default_run;