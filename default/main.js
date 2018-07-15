// This file should be entry point for OS, and initializer for all the processes

var system_boot = require('OS')

var Corps;
var RUtils;

var SimpleAI

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

function draw_room_data()
{
    for(var r in Game.rooms)
    {
        var rdata = get_room_data(r)
        rdata.draw_room_info()
    }   
}

var analyser
var analyserComplete = false

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

function* terrain_inspector()
{
    for(var r in Game.rooms)
    {
        var room = Game.rooms[r]
        console.log("Analysing room " + r)
        
        var rdata = get_room_data(r)
        yield* rdata.map_analyser_thread() 
        yield* OS.break();
    }
}

// Loop function to update towers
function tower_updater()
{
    // This thread updates the towers.
    for(var r in Game.rooms)
    {
        var room = Game.rooms[r]
        var towers = room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
	
    	for(var r in towers)
        {        
            run_tower(towers[r])
            //_.forEach(towers[r], )
        }
    }
    //console.log("Tower updater has completed at tick " + Game.time)
}

// Loop function to auto-renew creeps nearby the spawns
function auto_spawn_renew()
{
    // Spawn renewing
    for(var s in Game.spawns)
    {
        var spawn = Game.spawns[s]    

        if(!spawn.spawning)
        {
            var targets = spawn.pos.findInRange(FIND_MY_CREEPS, 1, {filter:function (obj) {return obj.ticksToLive < 400}})
            
            if(targets.length > 0)
            {
                for(var i in targets)
                    spawn.renewCreep(targets[i])
            }
        }
    }
}

// Typical game loop
var game_loop = function()
{
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
}

// This function will be called on system startup
// We should register all necessary threads and tasks here.
// We will not visit this function until next restart.
function* init_system()
{
    // This function will be executed infinetly, once per game tick
    console.log("AI: Starting")
    
    Corps = require('corporation')
    RUtils = require('utils.room')
    SimpleAI = require('simple.ai')
    SimpleAI.init()
    var pid = yield* OS.create_thread(terrain_inspector(), 'terrain_inspector')
    yield* OS.wait({pid: pid})
    yield* OS.create_loop(game_loop, "/main")
    yield* OS.create_loop(tower_updater, 'towers')
    yield* OS.create_loop(auto_spawn_renew, 'spawn_renew')
    
    
    console.log("AI: Init is complete")
}

module.exports.loop = function() 
{ 
    system_boot(init_system())
}
