/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('utils.room');
 * mod.thing == 'a thing'; // true
 */
 
 
/** Will find and fill in mining spots **/
/** @param (RoomPosition) pos - central position **/
Room.prototype.analyse_mines=function(pos)
{
    //console.log("Updating mine info")
    var sources = this.find(FIND_SOURCES);
    //var pos = spawn.pos
    
    for(var i in sources)
    {
        var mine = sources[i]

        if(!('storage' in mine.memory))
            mine.memory.storage = 0

        if(!('build_storage' in mine.memory))
            mine.memory.build_storage = 0


        var storage_sites = mine.pos.findInRange(FIND_STRUCTURES, 2, 
        {
            filter: { structureType: STRUCTURE_CONTAINER }
        });

        for(var s in storage_sites)
        {
            storage_sites[s].memory = storage_sites[s].memory || {}
            storage_sites[s].memory.type = "source"                
        }

        console.log("Found "+storage_sites.length + " storage sites near mine " + mine.id)

        var storage_build_sites = mine.pos.findInRange(FIND_CONSTRUCTION_SITES, 2, 
        {
            filter: { structureType: STRUCTURE_CONTAINER }
        });
        console.log("Found "+storage_build_sites.length + " storage build sites near mine " + mine.id)
        
        if(mine.id in Memory.mine_info)
           continue;
        //if(!('user' in Memory.mine_info))
        //    Memory.mine_info.user = {}
        var path = pos.findPathTo(mine.pos)
        var distance = path.length
        
        var spots = []
        var max = 0
        
        if(path)
        {
            for(var x = mine.pos.x-1; x <= mine.pos.x+1; x++)
                for(var y = mine.pos.y-1; y <= mine.pos.y+1; y++)
                {
                    if(x == mine.pos.x && y == mine.pos.y)
                        continue;
                    var spot_pos = new RoomPosition(x,y, mine.pos.roomName)
                    var tile = Game.map.getTerrainAt(spot_pos)

                    if(tile != 'wall')
                    {
                        spots.push(spot_pos)
                        var res = mine.room.createFlag(spot_pos, "Minespot_"+x+":"+y)
                        if(res == ERR_NAME_EXISTS)
                        {
                            
                        }
                        else
                        {
                            console.log("Created mine spot flag")
                        }
                    }
                }
            max = spots.length
        }
        
        var info = {
            spots : spots,
            distance : distance,
            max : max,
            current : 0,
            users : {},
        }   
        
        Memory.mine_info[mine.id] = info
        
    }
    
    var total_harvesters = 0
    for(var i in Memory.mine_info)
    {
        var info = Memory.mine_info[i]
        var harvesters_per_mine = info.max + Math.round(info.distance / 4);
        //console.log("Mine "+i+" needs "+harvesters_per_mine+" harvesters")
        total_harvesters = total_harvesters+ 1 //harvesters_per_mine
    }
    //console.log("Need " + total_harvesters + " harvesters")
    
    Memory.need_harvesters = total_harvesters //Memory.mine_info.length
}


var getObjectPos=function(obj)
{
    //if(obj instanceof RoomPosition)
    //    return obj

    //if(obj instanceof Creep)
    //    return obj.pos
    
    if(obj instanceof StructureSpawn)
        return obj.pos

    if(obj instanceof StructureSource)
        return obj.pos

    if(obj instanceof StructureStorage)
        return obj.pos

    throw("Cannot get position from unknown object"+obj)
}
/** 
 * @param {RoomPosition) from - starting position for a road
 * @param {RoomPosition) to - finish position for a road
 * @param {int) skip - number of tiles to be skipped before the finish
**/
Room.prototype.make_road = function(from, to, skip)
{
    var pos_from = getObjectPos(from)
    var pos_to = getObjectPos(to)

    var path = pos_from.findPathTo(pos_to)
    if(path.length > 0)
    {
        for(var i = 0; i < path.length - skip; i++)
        {
            var wp = path[i]
            createConstructionSite(wp.x, wp.y, structureType)
        }
    }
}

/// Connect room spawn with mines
Room.prototype.net_mines = function()
{
    var mines = this.find(FIND_STRUCTURES, filter = {structureType : STRUCTURE_SOURCE})
    var spawns = this.find(FIND_STRUCTURES, filter = {structureType : STRUCTURE_SPAWN})
    
    if(spawns.length > 0 && mines.length > 0)
    {
        var spawn = spawns[0]
        for(var i in mines)
        {
            var mine = mines[i]
            this.make_road(spawn, mine, 1)
        }
    }
}


Room.prototype.remove_build_sites = function()
{
    var sites = this.find(FIND_CONSTRUCTION_SITES)
    if(sites.length == 0)
        return;
    for(var i in sites)
    {
        sites[i].remove()
    }
}

module.exports = {
    init : function()
    {
        
    }
};