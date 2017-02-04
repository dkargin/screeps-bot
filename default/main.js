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

global.loadVisual = function(){
  return console.log('<script>' + 
    'if(!window.visualLoaded){' + 
    '  $.getScript("https://screepers.github.io/screeps-visual/src/visual.screeps.user.js");' + 
    '  window.visualLoaded = true;' + 
    '}</script>')
}

function visualizePaths(){
  let Visual = require('visual')
  let colors = []      
  let COLOR_BLACK = colors.push('#000000') - 1
  let COLOR_PATH = colors.push('rgba(255,255,255,0.5)') - 1
  _.each(Game.rooms,(room,name)=>{
    let visual = new Visual(name)
    visual.defineColors(colors)
    visual.setLineWidth = 0.5
    _.each(Game.creeps,creep=>{
      if(creep.room != room) return
      let mem = creep.memory
      if(mem._move){
        let path = Room.deserializePath(mem._move.path)
        if(path.length){
          visual.drawLine(path.map(p=>([p.x,p.y])),COLOR_PATH,{ lineWidth: 0.1 })
        }
      }
    })
    visual.commit()
  })
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

var analyser

global.start_test = function()
{
	Memory.test_mode = true
}

global.remove_flags = function()
{
	for(var f in Game.flags)
	{
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
		loadVisual()
        firstTick = false;
		
        console.log("<b> ====================== Script has restarted at tick " + Game.time + " =================</b>")

        var tower_updaters = []   
    }
	
	if(Memory.test_mode && !analyser)
	{
		analyser = update_landscape()
		//remove_flags()
	}
	
	if(analyser)
	{
		var y = analyser.next()
		if(y.done)
			analyser = undefined
		console.log("Got from generator: " + y.value + " done=" + y.done + " CPU=" + Game.cpu.getUsed() )
		profiler.output()
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
