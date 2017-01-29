/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('utils.room');
 * mod.thing == 'a thing'; // true
 */
 
RoomPosition.prototype.list_free_spots = function()
{
    var spots = []
    var spot_pos = new RoomPosition(this.x,this.y, this.roomName)
    
    for(var x = this.x-1; x <= this.x+1; x++)
        for(var y = this.y-1; y <= this.y+1; y++)
        {
            if(x == this.x && y == this.y)
                continue;
            
            [spot_pos.x,spot_pos.y]  = [x, y]
            
            var tile = Game.map.getTerrainAt(spot_pos)

            if(tile != 'wall')
                spots.push([x,y])
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
	
	/// There is no creep to feed the spawn, so 
	if(!capabilities.feed_spawn)
		capacity = this.energyAvailable
	
	/// TODO: check whether the room has 'mover' capability
	/// effectively making its energy capped at 300 corresponding to t1
	var tier = 0
	
	for(var i in tiers)
	{
		if(tiers[i] <= capacity)
		{
			tier = i
		}
	}
	//console.log("Room has tspawn=" + capacity + " tier=" + tier)
	return tier
}

/// Sum two key->number tables 
function sum_table(a, b)
{
	var result = clone(a)
	for(var i in b)
	{
		if(!(i in result))
			result[i] = b[i]
		else
		{
			result[i] += b[i]
		}
	}
	return result
}

function append_table(result, b)
{
	for(var i in b)
	{
		if(!(i in result))
			result[i] = b[i]
		else
		{
			result[i] += b[i]
		}
	}
	return result
}


Room.prototype.get_capabilities = function()
{
	this.memory.capabilities = this.memory.capabilities || {}
	
	if(!this.memory.last_caps_calc)
		this.memory.last_caps_calc = Game.time
	
	if(Game.time - this.memory.last_caps_calc > 10)
	{
		this.memory.capabilities = {}
		var result = this.memory.capabilities
		this.find(FIND_MY_CREEPS, {
		    filter: function(creep) 
		    {
		    	if(creep.get_capabilities)
		    	{
		    		var caps = creep.get_capabilities()
		    		//console.log("Creep " + creep.name + " has caps: " + JSON.stringify(caps))
		    		append_table(result, caps)
		    	}
		    	else
		    	{
		    		console.log("Creep " + creep.name + " has no standard capabilities")
		    	}
		    	return false
		        //return creep.getActiveBodyparts(ATTACK) == 0;
		    }
		});
		
		this.memory.last_caps_calc = Game.time
		
		console.log("Recalculated room capabilities: " + JSON.stringify(result))
	}
	return this.memory.capabilities
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
