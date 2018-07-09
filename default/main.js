// This file should be entry point for OS, and initializer for all the processes

var system_boot = require('OS')

var RUtils = require('utils.room')

// Disabled so far
//var Corps = require('corporation')
//var HoP = require('spawner')
//var SimpleAI = require('simple.ai')

/// Include corporation modules
/*
require('corp.spawn')
require('corp.build')
require('corp.upgrader')
require('corp.mine')
*/

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

/**
 * Run landscape updating process. Can take several turns to complete
 */
var update_landscape = function*()
{
    context = yield OS.GetContext;

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

/*

*/

global.start_test = function()
{
	Memory.settings.test_mode = true
    analyserComplete = false
    analyser = update_landscape()
    //Game.profiler.profile(3)
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

function tower_updater()
{
    // This thread updates the towers.
    for(var r in Game.rooms)
    {
        process_room_towers(Game.rooms[r])
    }
    console.log("Tower updater has completed its turn")
}

function renew_creeps_near_spawn(spawn)
{
    if(spawn.spawning)
        return;
    var targets = spawn.pos.findInRange(FIND_MY_CREEPS, 1, {filter:function (obj) {return obj.ticksToLive < 400}})
    
    if(targets.length > 0)
    {
        for(var i in targets)
            spawn.renewCreep(targets[i])
    }
}

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
	
    //SimpleAI.run()
    
    //Corps.update()
    
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

// This function will be called on system startup
// We should register all necessary threads and tasks here.
// We will not visit this function until next restart.
function* init_system()
{
    
    // This function will be executed infinetly, once per game tick
    console.log("Trying to start main loop")
    var pid_main = yield* OS.create_loop(game_loop, "/main")
    console.log(" - created main thread with pid=" + pid_main)
    
    console.log("init_system - starting towers")
    var pid_tower = yield* OS.create_loop(tower_updater, 'towers')
    console.log("init_system is complete")
}

module.exports.loop = function() 
{ 
    system_boot(init_system())
    //build(spawn, STRUCTURE_EXTENSION);
}
