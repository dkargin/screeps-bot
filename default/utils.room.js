/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('utils.room');
 * mod.thing == 'a thing'; // true
 */
 
function list_free_spots(pos)
{
    var spots = []
    
    for(var x = pos.x-1; x <= pos.x+1; x++)
        for(var y = pos.y-1; y <= pos.y+1; y++)
        {
            if(x == pos.x && y == pos.y)
                continue;
            var spot_pos = new RoomPosition(x,y, mine.pos.roomName)
            var tile = Game.map.getTerrainAt(spot_pos)

            if(tile != 'wall')
            {
                spots.push(spot_pos)
            }
        }
    return spots
}

Room.prototype.remove_flags = function()
{
    for(var i in Game.flags)
    {
        var flag = Game.flags[i]
        if (flag.pos.roomName = this.name)
            flag.remove()
    }
}

Game.getObjectPos=function(obj)
{
    if(obj instanceof RoomPosition)
        return obj

    if(obj instanceof Creep)
        return obj.pos
    
    if(obj instanceof StructureSpawn)
        return obj.pos

    if(obj instanceof Source)
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
        for(var i = 0; i < path.length - skip - 1; i++)
        {
            var wp = path[i]
            this.createConstructionSite(wp.x, wp.y, STRUCTURE_ROAD)
        }
        
        var last_wp = path[path.length-2]
        
        return new RoomPosition(last_wp.x, last_wp.y, pos_to.roomName)
    }
}

/// Get room current tech level
/// Used by corporations to get available actions

Room.prototype.get_tech_tier = function()
{
	var tick = Game.tick
	var tiers = [ 300, 300, 300 + 50*5, 300 + 50*10, 300+50*20 ]
	var capacity = this.energyCapacityAvailable
	var capabilities = this.get_capabilities()
	
	/// TODO: check whether the room has 'mover' capability
	/// effectively making its energy capped at 300 corresponding to t1
	var tier = 0
	
	for(var i in tiers)
	{
		if(tiers[i] < capacity)
		{
			tier = i
		}
	}
	
	return tier
}

Room.prototype.get_capabilities = function()
{
	room.memory.capabilities = room.memory.capabilities || {}
	
	var caps = room.memory.capabilities
	
	if(!room.memory.last_caps_calc)
		room.memory.last_caps_calc = Game.tick
	//var result = 
	if(tick - room.memory.last_caps_calc > 10)
	{
		this.find(FIND_MY_CREEPS, {
		    filter: function(creep) 
		    {
		    	if(creep.get_capabilities)
	    		{
		    		var caps = creep.get_capabilities()
	    		}
		        return object.getActiveBodyparts(ATTACK) == 0;
		    }
		});
		
		console.log("Recalculated room capabilities: " + JSON.stringify(caps))
	}
	return result
}
/// Connect room spawn with mines
Room.prototype.net_mines = function()
{
    var mines = this.find(FIND_SOURCES)
    var spawns = this.find(FIND_STRUCTURES, {filter : {structureType : STRUCTURE_SPAWN}})
    
    var ends = []
    
    if(spawns.length > 0 && mines.length > 0)
    {
        var spawn = spawns[0]
        for(var i in mines)
        {
            var mine = mines[i]
            ends.push(this.make_road(spawn, mine, 1))
        }
    }
    if(ends.length > 0)
    {
        for(var i in ends)
        {
            this.createConstructionSite(ends[i], STRUCTURE_CONTAINER)
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
