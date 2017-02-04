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

global.build_path = function(from, to)
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
