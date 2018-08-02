// This file should be entry point for OS, and initializer for all the processes

var system_boot = require('OS')

var Corps;
var RUtils;

var SimpleAI

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

function draw_room_data()
{
    for(var r in Game.rooms)
    {
        var rdata = get_room_data(r)
        rdata.draw_room_info()
    }   
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

function processRoomSpawns(rname)
{
	var room = Game.rooms[rname]
	if (!room)
		return;
	
	var spawns = room.getMySpawns()
	var spawnQueue = room.getSpawnQueue()
	
	// Get corporations serviced by this spawns
	var corps = room.getServicedCorporations()
	
	for(var c in corps)
	{
		var corp = corps[c]
		var vacancies = corp.getVacancies()
	}
	
	for (var s in spawns)
	{
		
	}
}
// This function will be called on system startup
// We should register all necessary threads and tasks here.
// We will not visit this function until next restart.
function* init_system()
{
    // This function will be executed infinetly, once per game tick
    console.log("AI: Starting")
    
    implant_memory(Source.prototype, '_sources');
    implant_memory(StructureContainer.prototype, '_containers');
    implant_memory(StructureStorage.prototype, '_storages');
    implant_memory(Corporation.prototype, '_corporations', (obj)=>obj.name)
    implant_cache(Creep.prototype, '_creeps')
    implant_cache(Flag.prototype, '_flags')
    
    require('corp.mine')
    RUtils = require('utils.room')
    //SimpleAI = require('simple.ai')
    
    var pid = yield* OS.create_thread(terrain_inspector(), 'terrain_inspector')
    yield* OS.wait({pid: pid})
    
    // 1. Starting game from the scratch, or we do not have valid previous session
    // Iterate through all the rooms with spawns. This rooms should be marked as 'TOWN'
    // Spawn corporations for every room
    for(var r in Game.rooms)
    {
        var room = Game.rooms[r]
        // Check if this room is owned
        if (!room.controller || !room.controller.my)
        	continue;
        
        // Spawn mine corporation if room is classified as a town
        var rdata = get_room_data(r)
        if (rdata)
        {
            var miner = new MineCorp(room, rdata)
            miner.printData()
            yield* OS.create_loop(()=>miner.update(), "corp/" + miner.getName())
        }
    }
    
    if (SimpleAI)
    {
        SimleAI.init()
        yield* OS.create_loop(SimpleAI.run, "main")
    }
    //yield* OS.create_loop(draw_room_data, "room_drawer", {priority:100})
    yield* OS.create_loop(tower_updater, 'towers')
    yield* OS.create_loop(auto_spawn_renew, 'spawn_renew')
    
    console.log("AI: Init is complete")
}

module.exports.loop = function() 
{ 
    system_boot(init_system())
}
