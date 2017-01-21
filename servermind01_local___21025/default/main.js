var lastIndex = 0;

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

/*
Object.defineProperty(Source.prototype, 'memory', {
    get: function() {
        if(_.isUndefined(Memory.sources)) {
            Memory.sources = {};
        }
        if(!_.isObject(Memory.sources)) {
            return undefined;
        }
        return Memory.sources[this.id] = Memory.sources[this.id] || {};
    },
    set: function(value) {
        if(_.isUndefined(Memory.sources)) {
            Memory.sources = {};
        }
        if(!_.isObject(Memory.sources)) {
            throw new Error('Could not set source memory');
        }
        Memory.sources[this.id] = value;
    }
});
*/

HoP = require('spawner')

var controllers = 
{ 
    harvester : require('role.harvester'),
    upgrader : require('role.upgrader'),
    mover : require('role.mover')
}

run_tower = function(tower)
{
    //console.log("Updating tower "+ tower)
    var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if(closestHostile) {
        tower.attack(closestHostile);
    }
    else
    {
        var closestDamagedStructure = tower.room.find(FIND_STRUCTURES, {
            //filter: (structure) => structure.hits < structure.hitsMax
            filter: (structure) => structure.hits < 10000 
        });
        if(closestDamagedStructure.length > 0) {
            tower.repair(closestDamagedStructure[0]);
        }
    }
}

var firstTick = true

module.exports.loop = function () 
{
    if(firstTick)
    {
        firstTick = false;
        controllers.harvester.init_recipes(HoP)
        controllers.mover.init_recipes(HoP)
        controllers.upgrader.init_recipes(HoP)
    }

    for(var i in Game.flags)
    {
        var flag = Game.flags[i]
        if(!flag.memory)
            flag.memory = {}
        if(!flag.memory.role)
            flag.memory.role = "none"
    }
    
    for(var i in Memory.creeps) {
        if(!Game.creeps[i]) {
            delete Memory.creeps[i];
        }
    }

    for(var u in controllers) {
        controllers[u].start_turn()
    }
    
    for(var r in Game.rooms)
    {
        var room = Game.rooms[r]
        HoP.administer_room(room)
        /// Do the towers
        var towers = room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
        for (let towerName in towers) 
        { 
            var tower = towers[towerName]; 
            run_tower(tower)
            //let creepsInRoom = tower.room.find(FIND_HOSTILE_CREEPS); 
            //console.log("TOWERS FOUND: " + towers); 
        }    
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

    
    
    for(var s in Game.spawns)
    {
        var spawn = Game.spawns[s]    

        for(var i in controllers)
        {
            controllers[i].check_spawn(spawn)
        }

        if(!spawn.spawning)
        {
            var targets = spawn.pos.findInRange(FIND_MY_CREEPS, 1)
            
            if(targets.length > 0)
            {
                for(var i in targets)
                    spawn.renewCreep(targets[i])
            }
        }
    }


    build(spawn, STRUCTURE_EXTENSION);
}
