
const profiler = require('screeps-profiler');
//This line monkey patches the global prototypes.
profiler.enable();

var memoryUtils = require('memory')
var roomUtils = require('utils.room')
var Corps = require('corporation')
var Actions = require('utils.action')

var lastIndex = 0;

console.logch = function(channel, data)
{
	Memory.debug = Memory.debug || {}
	Memory.debug[channel] = Memory.debug[channel] || true
	
	
	if(Memory.debug[channel])
		console.log(channel + ":" + data)
}

function getRandomFreePos(startPos, distance) {
    var x,y;
    do {
        x = startPos.x + Math.floor(Math.random()*(distance*2+1)) - distance;
        y = startPos.y + Math.floor(Math.random()*(distance*2+1)) - distance;
    }
    while((x+y)%2 != (startPos.x+startPos.y)%2 || Game.map.getTerrainAt(x,y,startPos.roomName) == 'wall');
    return new RoomPosition(x,y,startPos.roomName);
}

function build(spawn, structureType) {
    var structures = spawn.room.find(FIND_STRUCTURES, {filter: {structureType, my: true}});
    for(var i=0; i < CONTROLLER_STRUCTURES[structureType][spawn.room.controller.level] - structures.length; i++) {
        getRandomFreePos(spawn.pos, 5).createConstructionSite(structureType);
    }
}

function build_path(from, to)
{
    var path = from.pos.findPathTo(to.pos)
    var room = from.pos.roomName
    
    if(path)
    {
        for(var i in path)
        {
            var wp = path[i]
            from.room.createConstructionSite(wp.x, wp.y, STRUCTURE_ROAD)
        }
    }
}

Spawn.prototype.test = function() {
    console.log("Hello world");
}

var HoP = require('spawner')

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

var controllers = 
{ 
    harvester : require('role.harvester'),
    mover : require('role.mover'),
//    expedition : require('role.expedition')
}

var firstTick = true

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

var SimpleAI = require('simple.ai')

module.exports.loop = function() { profiler.wrap(function () 
{   
	if(firstTick)
    {
        firstTick = false;
        
        console.log("<b> ====================== Script has restarted =================</b>")
		
        for(var i in Game.spawns)
            Game.spawns[i].room.analyse_mines(Game.spawns[i])
    }
	
	for(var r in Game.rooms)
    {
        var room = Game.rooms[r]
        //HoP.administer_room(room)
        /// Do the towers
        var towers = room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
        _.forEach(towers, run_tower)
    }
	
    SimpleAI.run()
    
    //Corps.update()
    
    /*
    for(var u in controllers) {
        controllers[u].start_turn()
    }

    for(var name in Game.creeps) 
    {
        var creep = Game.creeps[name];
        var role = creep.memory.role;
        
        if(!creep.my)
            continue
        
        if(creep.memory.role in controllers)
            controllers[role].run(creep)
    }    
    */
    
    for(var s in Game.spawns)
    {
        var spawn = Game.spawns[s]    

/*
        for(var i in controllers)
        {
            controllers[i].check_spawn(spawn)
        }
*/
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

    memoryUtils.clean_memory()
    //build(spawn, STRUCTURE_EXTENSION);
});
}
