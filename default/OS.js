'use strict'
/*
 * Module contains memory utilities at system level
 */

global.OS = global.OS || {}

var OS_LOG_FATAL = 5
var OS_LOG_ERROR = 4
var OS_LOG_WARN = 3
var OS_LOG_INFO = 2
var OS_LOG_DEBUG = 1
var OS_LOG_VERBOSE = 0

function log_suffix(level)
{
    switch(level)
    {
        case OS_LOG_FATAL: return "FATAL";
        case OS_LOG_ERROR: return "ERROR";
        case OS_LOG_WARN: return "WARNING";
        case OS_LOG_INFO: return "INFO";
        case OS_LOG_DEBUG: return "DEBUG";
        case OS_LOG_VERBOSE: return "VERBOSE";
        default: return "";
    }
}

// Log level setting. Maps to Memory.settings.logLevel
OS.logLevel = OS_LOG_INFO

OS.log = function(level, text)
{
    if(this.logLevel <= level)
        console.log("OS:" + log_suffix(level) + ": " + text)
}

OS.log_fatal = function(text) { this.log(OS_LOG_FATAL, text) }
OS.log_error = function(text) { this.log(OS_LOG_ERROR, text) }
OS.log_warn = function(text) { this.log(OS_LOG_WARN, text) }
OS.log_info = function(text) { this.log(OS_LOG_INFO, text) }
OS.log_debug = function(text) { this.log(OS_LOG_DEBUG, text) }
OS.log_verbose = function(text) { this.log(OS_LOG_VERBOSE, text) }

// Alters current log level
OS.setLogLevel = function(level)
{
    if (level != OS.logLevel)
    {
        OS.logLevel = level
        _.set(Memory, ['settings', 'logLevel'], level)
    }
}

// Defines current OS-specific memory version
// System will reset current memory if this value differs from the cached one
var OS_MEMORY_VERSION = 2

// Thread tables
var thread_by_path = {}
var thread_by_pid = {}
var free_pids = []
var last_pid = 1

// Threshold for stopping thread schedule and ending cycle
var os_cpu_threshold = 0.5
// Maximum conditions to be awaited for each thread
var max_waits_per_thread = 5
// Flag for tracking the first tick
var firstTick = true

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
function memory_init(user_memory_version)
{
    OS.log_info("Initializing BOT memory")
    
    /// Init volatile cache
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
    
    // Init settings page
    _.defaults(Memory.settings, 
    {
        os_cpu_threshold: os_cpu_threshold,
        os_log_level: OS_LOG_INFO
    })

    // Init OS data page
    var os_mem_default = {session_id: 0, start_tick: Game.time, mem_version: OS_MEMORY_VERSION, threads: {}}
    
    _.defaults(Memory.os, os_mem_default)
    
    if (Memory.os.mem_version != OS_MEMORY_VERSION)
    {
        // Resetting memory to initial state
        OS.log_info("OS memory version has changed. Resetting Memory.os")
        Memory.os = os_mem_default
    }
    
    current_session_id = Memory.os.session_id + 1
    Memory.os.session_id = current_session_id
    
    OS.logLevel = Memory.settings.os_log_level;
    os_cpu_threshold = Memory.settings.os_cpu_threshold;
    
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
var CMD_CREATE_THREAD = 1
var CMD_WAIT = 4
var CMD_ACQUIRE = 5
var CMD_RELEASE = 6
var CMD_GET_SELF = 7
// Reimplemented using 'Sleep' command
//var CMD_FINISH_TICK = 8

var ThreadState = 
{
    Initial: 0,
    Waiting: 1,     // Waitint to be scheduled
    Done: 3,        // Thread has exited
    SysCall: 4,     // Interrupted by a system call
    Exception: 5,
};

function stateToString(state)
{
    switch(state)
    {
        case ThreadState.Initial: return "initial";
        case ThreadState.Waiting: return "waiting";
        case ThreadState.Done: return "done";
        case ThreadState.SysCall: return "syscall";
        case ThreadState.Exception: return "exception";
        default:
            return "unknown";
    }
}

// Error for OS problems
class OSError extends Error { };

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
        // Thread text path. It can be used with lodash in future
        this.path = path
        
        this.state = ThreadState.Initial
        
        /// Last updated tick
        this.last_tick = 0
        
        this.loop = opts.loop || false
        this.pid = 0
        // This field is used to check memory integrity
        // If we find a thread with session_id differnent from OS.session_id, we 
        // clean this data
        this.session_id = 0
        this.parent_ = parent
        // Index in thread queue
        this.schedule_index = -1
        
        // A list of awaited conditions
        this.conditions = []
        // Statistics
        this.stat_syscalls = 0
        this.stat_waits = 0
        this.stat_cpu = 0
    }

    /// Calculates current thread priority
    effective_priority(tick)
    {
        return this.priority * (tick - this.last_tick)
    }
    
    get_state()
    {
        return this.state
    }
}

function get_tick()
{
    return Game.time
}

function spin_thread(thread, tick)
{
    OS.log_debug("Spinning thread " + style_os_symbol(thread.path) + " at tick " + style_os_symbol(tick));
    
    thread.last_tick = tick
    
    if (!(thread instanceof ThreadContext))
        throw("OS: Can spin threads only")
    
    // We can iterate a thread several times
    do
    {
        // Iterate thread once
        var result
        switch(thread.get_state())
        {
            case ThreadState.Initial:
                OS.log_debug("thread " + style_os_symbol(thread.path) + " is in initial state. Running until the first interrupt");
                result = thread.generator.next()
                break;
            case ThreadState.SysCall:
                //console.log("Thread \"" + thread.path + "\" is being restored from system interrupt.");
                var os_result = thread.os_result
                thread.os_result = null
                result = thread.generator.next(os_result)
                break;
            default:
                throw("Unhandled state for the thread=" + state)
        }
        
        thread.state = ThreadState.Initial;
        
        // Parse thread result
        if (!result)
        {
            thread.state = ThreadState.Exception
            throw OSError("Generator should return something good")
        }
        else if (result.done)
        {
            OS.log_info("thread " + style_os_symbol(thread.path) + " has exited smoothly");
            thread.state = ThreadState.Done
            return true;
        }
        
        var signal = result.value
        
        if(!(signal instanceof SysCommand))
            throw OSError("Thread \"" + thread.path + "\" has yielded to unknown " + (typeof signal));
        
        switch(signal.command)
        {
            case CMD_CREATE_THREAD:
                OS.log_debug("thread " + style_os_symbol(thread.path) + " is interrupted by command CreateThread");
                //[generator, path, opts]
                var newThread = create_thread_impl(thread, ...signal.args)
                thread.os_result = newThread.pid
                thread.state = ThreadState.SysCall;
                break;
                
            case CMD_WAIT:
                OS.log_debug("thread \"" + thread.path + "\" is interrupted by command WAIT with args " + JSON.stringify(signal.args));
                
                // Should fill in all wait conditions
                for(var i in signal.args)
                {
                    var arg = signal.args[i]
                    
                    // Add condition about PID
                    if ('pid' in arg)
                    {
                        thread.conditions.push(function(OS)
                        {
                            // Check if pid with this ID has died
                            if (!thread_by_pid[arg.pid] ||
                                thread_by_pid[arg.pid].state == ThreadState.Done ||
                                thread_by_pid[arg.pid].state == ThreadState.Exception)
                                return arg;
                        });
                        continue;
                    }
                    
                    // Add condition to wake up after N ticks
                    if ('ticks' in arg)
                    {
                        var wait_ticks = arg.ticks
                        var awake_tick = tick + wait_ticks
                        OS.log_verbose("will wake after " + wait_ticks + " ticks, at tick=" + awake_tick);
                        thread.conditions.push(function(OS)
                        {
                            if(_.gte(get_tick(), awake_tick))
                                return arg;
                        });
                        continue;
                    }
                    
                    OS.log_warn("unknown wait condition " + arg)
                }
                
                if (thread.conditions.length > 0)
                {
                    thread.state = ThreadState.Waiting
                }
                else
                {
                    OS.log_error("no wait conditions were defined")
                    return;
                }
                break;
                
            case CMD_GET_SELF:
                // TODO: I guess we should repeat this thread right here
                OS.log_debug("thread \"" + thread.path + "\" is interrupted by command GetSelf");
                thread.os_result = thread;
                thread.state = ThreadState.SysCall;
                break;
                
            default:
                os.log_error("thread \"" + thread.path + "\" is interrupted by an unhandled system command=" + signal.command);
                break;
        }
    }while(thread.get_state() == ThreadState.SysCall);
    
    return true;
}

function dump_thread_stats()
{
    for(var p in thread_by_path)
    {
        var thread = thread_by_path[p]
        
        Memory.os.threads[p] = 
        {
            pid: thread.pid,
            state: stateToString(thread.get_state()),
            session: thread.session_id,
        }
    }
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
                
            case ThreadState.Waiting:
                if (_.isEmpty(thread.conditions))
                    OS.log_error("thread " + style_os_symbol(thread.path) + " is waiting, but has no conditions");
                else
                    OS.log_debug("thread " + style_os_symbol(thread.path) + " is trying to check wait conditions");
                    
                var awaken = [];
                for (var i in thread.conditions)
                {
                    var check = thread.conditions[i](OS)
                    if (check)
                    {
                        awaken.push(check);
                        break;
                    }
                }
                
                if (awaken.length > 0)
                {
                    OS.log_debug("thread "+ style_os_symbol(thread.path) + " has awakened by: " + JSON.stringify(awaken));
                    thread.state = ThreadState.SysCall
                    thread.conditions = []
                    thread.os_result = awaken
                    spawn.push(thread)
                }
                
                break;
                
            case ThreadState.Exception:
                OS.log_error("thread "+ style_os_symbol(thread.path) + " is in Error state - deleting it");
                dead_threads.push(thread)
                break;
            default:
                spawn.push(thread)
                break;
        }   
    }

    /// 2. Sort threads using local priority
    spawn.sort((thread) => thread.effective_priority(tick))

    var threads_iterated = 0

    //if (spawn.length == 0)
    //    OS.log_warn("No threads were scheduled for tick " + tick)
        
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
        var thread = dead_threads[i]
        remove_thread(thread)
    }
    
    // TODO: Move it to a separate thread
    dump_thread_stats()
    
    return threads_iterated
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
        
    // TODO: Save statistics for this thread
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
    OS.log_info("Created thread " + style_os_symbol(path) + " with pid="+style_os_symbol(pid) + " parent_path=" + style_os_symbol(parent_path) + " loop=" + style_os_symbol(tc.loop))
    
    return tc
}


OS.create_thread = function*(generator, path, opts = {})
{
    //console.log("create_thread("+path+"): creating child thread")
    var pid = yield new SysCommand(CMD_CREATE_THREAD, [generator, path, opts])
    return pid
}

// Wrapper for all loop threads
function* loop_wrapper(loop_fn)
{
    //console.log("create_loop("+path+"): started loop wrapper")
    var env = yield* OS.this_thread()
    do
    {
        loop_fn()
    }while(yield* OS.finishTick());
    OS.log_debug("create_loop("+style_os_symbol(env.path)+"): finished loop wrapper")
}

OS.create_loop = function*(fn, path, opts = {})
{
    if (!_.isFunction(fn))
    {
        OS.log_error("create_loop("+style_os_symbol(path)+": should give a function")
        return 0
    }
    // Returning PID of that process
    return yield* OS.create_thread(loop_wrapper(fn), path, _.defaults({loop:true}, opts))
}

OS.finishTick = function*()
{
    return yield new SysCommand(CMD_WAIT, [{ticks:1}])
}

OS.this_thread = function*()
{
    return yield new SysCommand(CMD_GET_SELF, [])
}

/*
 * Wait for some condition
 * Variants: opts = {pid: 1}
 */
OS.wait = function*()
{
    var args = [...arguments]
    return yield new SysCommand(CMD_WAIT, args)
}

OS.break = function*()
{
    return yield new SysCommand(CMD_WAIT, [{ticks:1}])
}

// Sleep for specified number of ticks
OS.sleep = function*(ticks=1)
{
    var args = [...arguments]
    return yield new SysCommand(CMD_WAIT, [{ticks:ticks}])
}

/// Used in main as initializer for an OS
function os_default_run(start_method)
{
    if(firstTick)
    {
        console.log("<b> ====================== Script has restarted at tick " + Game.time + " =================</b>")
        memory_init()
        
        // This should be some sort of a thread?
        var boot_pid = create_thread_impl(null, start_method, 'bootloader').pid
        
        // Starting memory cleaner. It will clean memory caches
        // User can upload additional clean methods
        create_thread_impl(null, function*()
        {
            yield* OS.wait({pid:boot_pid})
            OS.log_info("<b> starting memclean thread </b>")
            do
            {
                OS.memory_clean();
            }while(yield *OS.finishTick());
            OS.log_fatal("<b>!!! memclean has exited its cycle !!!</b>")
        }(), 'memclean');
        
        firstTick = false
        console.log("<b> ====================== Script initialization is done  =================</b>")
    }
    
    var cpu_limit = Game.cpu.limit * os_cpu_threshold
    
    try
    {
        var startCpu = Game.cpu.getUsed() 
        OS.log_info("Running tick " + Game.time)
        
        var totalThreads = 0
        
        do
        {
            var scheduled = schedule_threads()
            if (scheduled == 0)
                break;

            totalThreads += scheduled;
            var currentCpu = Game.cpu.getUsed()
            if (currentCpu > cpu_limit)
            {
                OS.log_warn("Scheduler has exceded cpu threahold: " + currentCpu + " over " + cpu_limit)
                break;
            }
        }while(true)
        
        if (totalThreads == 0)
            OS.log_warn("No threads were scheduled at tick " + Game.time)
        
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
 * Thread statistics:
 *  - runs_count
 *  - fail_count
 *  - last_status
 */ 
/// This is the example foe OS thread
/// We do thread testing for this
var test_worker = function *(name, time)
{
    var info = yield OS.thread_info()
    
    console.log(name + " has started")
    
    yield* OS.break("Stop at step 1")
    console.log(name + " is doing step2")
    yield* OS.break("Stop at step 2")
    console.log(name + " is doing step3")
    yield* OS.break("Stop at step 3")
    console.log(name + " is going to sleep for " + time + " ticks")
    yield* OS.sleep(time)
    return "Complete"
}

function* test_threads()
{
    console.log("Starting thread test")
    var pid1 = yield* OS.create_thread(test_worker("worker1"), "/worker1")
    var pid2 = yield* OS.create_thread(test_worker("worker1"), "/worker1")
    
    yield* OS.wait({pid: pid1}, {pid: pid2})
    console.log("Thread test is complete")
}



module.exports = os_default_run;