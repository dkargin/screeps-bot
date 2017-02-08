const profiler = require('screeps-profiler');
//This line monkey patches the global prototypes.
profiler.enable();

var memoryUtils = require('memory')
var RUtils = require('utils.room')
var Corps = require('corporation')
var Threads = require('threads')
var HoP = require('spawner')
var SimpleAI = require('simple.ai')

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

function draw_room_data()
{
    for(var r in Game.rooms)
    {
        var room = Game.rooms[r]
        console.log("Analysing room " + r)
        
        var rdata = RUtils.get_room_data(r)
        rdata.draw_room_info()
    }   
}

var analyser
var analyserComplete = false

global.start_test = function()
{
	Memory.test_mode = true
}

global.remove_flags = function()
{
	for(var f in Game.flags)
	{
        var flag = Game.flags[f]
        if(!flag.role)
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

var towers = {}

/**
 * Generator for processing tower update
 * @param room - room to be processed
 * @returns
 */
function * process_towers(room)
{
	towers = room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
	yield "Ready"
	
	while(true)
	{
		for(var r in towers)
	    {        
	        _.forEach(towers[r], run_tower)
	    }
		if(yield "Updated tick")
			break
	}
}

var firstTick = true

module.exports.loop = function() { profiler.wrap(function () 
{   
	if(firstTick)
    {
		Game.profiler.background()
        firstTick = false;
		
        console.log("<b> ====================== Script has restarted at tick " + Game.time + " =================</b>")

        var tower_updaters = []   
    }
	
	if(Memory.test_mode && !analyser)
	{
		analyser = update_landscape()
		//remove_flags()
	}
	
    if(Memory.test_mode && analyser)
    {
        if(!analyserComplete)
        {
            var y = analyser.next()
            if(y.done)
                analyserComplete = true
            console.log("Got from generator: " + y.value + " done=" + y.done + " CPU=" + Game.cpu.getUsed() )
        }
        //else
         //   draw_room_data()
    }
	
		
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

    memoryUtils.clean_memory()
    
    /*
    var used = Game.cpu.getUsed() 
    if(used > 10)
    {
    	console.log("WARNING: CPU spike=" + used + " detected at tick " + Game.time)
    	Game.profiler.output(10);
    }*/
    //build(spawn, STRUCTURE_EXTENSION);
});
}
