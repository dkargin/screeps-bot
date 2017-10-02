const profiler = require('screeps-profiler');
//This line monkey patches the global prototypes.

try
{
    require('memory')
}
catch(ex)
{
    console.log('Error importing memory module')
}

//var memoryUtils = require('memory')
var RUtils = require('utils.room')
var Corps = require('corporation')
var Threads = require('threads')
var HoP = require('spawner')
var SimpleAI = require('simple.ai')

/// Include corporation modules
require('corporation')
require('corp.spawn')
require('corp.build')
require('corp.upgrader')
require('corp.mine')

var start_tick = 0

/// Initialize room corporations
function init_room_corps(room)
{
    brain.corporations.init_tick = start_tick
    /// Create corporation for each spawn
    var spawns = room.find(FIND_MY_SPAWNS) || []
    if(spawns.length > 0)
    {
        console.log("Creating SpawnCorp")
        var spawnCorp = new brain.Corp.Spawn(room)
    }

    var buildCorp = new brain.Corp.Build(room)

    var mines = room.find(FIND_SOURCES) || []
    for(var i in mines)
    {
        console.log("Creating MineCorp for mine " + mines[i].pos)
        var mineCorp = new brain.Corp.Mine(mines[i])
    }

    var upgradeCorp = new brain.Corp.Build(room)
}

var run_tower = function(tower)
{
    //console.log("Updating tower "+ tower)
    var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if(closestHostile) {
        tower.attack(closestHostile);
    }
    else
    {
        var closestDamagedStructure = tower.room.find(FIND_STRUCTURES, {
            filter: (structure) => structure.hits < structure.hitsMax && structure.hits < 10000
        });
        if(closestDamagedStructure.length > 0) {
            tower.repair(closestDamagedStructure[0]);
        }
    }
}

/// We do thread testing for this
var test_thread = function *(arg1, arg2)
{
    var name = "noname"
    if(this && this.name)
        name = this.name
    console.log("Entered thread " + name)
    yield "Stop at step 1"
    console.log("Doing step2 with arg="+arg1 + " arg2="+arg2)
    yield "Stop at step 2"
    return "Complete"
}

/// Active threads
/// Maps PID to actual generator
brain.threads = {}

/**
 * Run landscape updating process. Can take several turns to complete
 */
var update_landscape = function*(context)
{
	for(var r in Game.rooms)
    {
        var room = Game.rooms[r]
        console.log("Analysing room " + r)
        
        var rdata = RUtils.get_room_data(r)
        yield *rdata.map_analyser() 
    }
}

function update_landscape2()
{
    for(var r in Game.rooms)
    {
        var room = Game.rooms[r]
        console.log("Analysing room " + r)
        
        var rdata = RUtils.get_room_data(r)
        yield *rdata.map_analyser() 
    }
}

function draw_room_data()
{
    for(var r in Game.rooms)
    {
        var rdata = RUtils.get_room_data(r)
        rdata.draw_room_info()
    }   
}

var analyser
var analyserComplete = false

global.start_test = function()
{
	Memory.settings.test_mode = true
    analyserComplete = false
    analyser = update_landscape()
    Game.profiler.profile(3)
}

global.remove_flags = function()
{
	for(var f in Game.flags)
	{
        var flag = Game.flags[f]
        if(!flag.memory.role)
		  Game.flags[f].remove()
	}
}

global.remove_sites = function()
{
	for(var r in Game.rooms)
	{
		var room = Game.rooms[r]
		
		var sites = room.find(FIND_CONSTRUCTION_SITES)
		for(var s in sites)
		{
			var site = sites[s]
			site.remove()
		}
	}
}

global.remove_debug = function()
{
	remove_flags()
	remove_sites()
}

function* tower_updater(room)
{

}

var towers = {}

/**
 * Generator for processing tower update
 * @param room - room to be processed
 * @returns
 */
function process_room_towers(room)
{
	var towers = room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
	
	for(var r in towers)
    {        
        run_tower(towers[r])
        //_.forEach(towers[r], )
    }
}

function process_towers()
{
    for(var r in Game.rooms)
    {
        process_room_towers(Game.rooms[r])
    }   
}

var firstTick = true

profiler.enable();

module.exports.loop = function() { profiler.wrap(function () 
{   

    /// Skip a tick if we have CPU problems
    if (Game.cpu.bucket < Game.cpu.tickLimit) {
        console.log('Skipping tick ' + Game.time + ' due to lack of CPU.');
        return;
    }

    try
    {    
    	if(firstTick)
        {
    		Game.profiler.background()
            brain.memory_init()

            for(var r in Game.rooms)
                init_room_corps(Game.rooms[r])

            firstTick = false;
    		
            console.log("<b> ====================== Script has restarted at tick " + Game.time + " =================</b>")

            brain.create_thread(tower_updater, 'towers')
        }
        
        Game.profiler.stream(10)

        //process_towers()
    	
        if(analyser)
        {
            var y = analyser.next()
            if(y.done)
            {
                analyser = undefined
            }
            console.log("Got from generator: " + y.value + " done=" + y.done + " CPU=" + Game.cpu.getUsed() )   
        }

        draw_room_data()
    	
        SimpleAI.run()
        
        //Corps.update()
        
        for(var s in Game.spawns)
        {
            var spawn = Game.spawns[s]    

            /*
            if(!spawn.spawning)
            {
                var targets = spawn.pos.findInRange(FIND_MY_CREEPS, 1, {filter:function (obj) {return obj.ticksToLive < 400}})
                
                if(targets.length > 0)
                {
                    for(var i in targets)
                        spawn.renewCreep(targets[i])
                }
            }*/
        }

        
        
        var used = Game.cpu.getUsed() 
        if(used > 10)
        {
        	console.log("WARNING: CPU spike=" + used + " detected at tick " + Game.time)
        	Game.profiler.output();
        }

        brain.memory_clean()
    }
    catch(ex)
    {
        console.log("EXCEPTION: main loop got exception: " + ex)
        console.log("stack: " + ex.stack)
    }
    //build(spawn, STRUCTURE_EXTENSION);
});
}
