/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('utils.room');
 * mod.thing == 'a thing'; // true
 */

/// Terrain type
const TERRAIN_WALL = 1
const TERRAIN_SWAMP = 2
/// Spot type
const SPOT_FREE = 0 				/// No spot. Can be occupied
const SPOT_MINE = 1 				/// Spot near the mine
const SPOT_MINE_CHEST = 2			/// Container near the mine
const SPOT_UPGRADE = 3 				/// Spot for upgrader creep
const SPOT_UPGRADE_CHEST = 4 		/// Container near the upgraders
const SPOT_RENEW = 5				/// Renew spot near the spawn
const SPOT_SPAWN = 6 				/// New creeps spawn here
const SPOT_GATE = 7
const SPOT_EXTENSION = 8

/// Ring of 8 points around center at [0, 0]
const contour_1 = [[1, 0], 
	[1,1], [0, 1], [-1, 1], 
	[-1, 0], 
	[-1, -1], [0, -1], [1, -1]]

/// Ring of 16 points at distance=2 around center [0, 0]
const contour_2 = [
	[ 2,-2], [ 2,-1], [ 2, 0], [ 2, 1],
	[ 2, 2], [ 1, 2], [ 0, 2], [-1, 2],
	[-2, 2], [-2, 1], [-2, 0], [-2,-1],
	[-2,-2], [-1,-2], [ 0,-2], [ 1,-2]
]

class RoomData
{
	constructor(name)
	{
		this.name = name
		this.tiles = new Array[50*50]
		this.room = Game.rooms[name]
		this.mines = {}
	}
	
	get_tile(x,y)
	{
		return this.tiles[x + y*50]
	}
	
	/// Read terrain and generate proper spots
	analyse_terrain()
	{
		if(room && room.memory.has_terrain)
			return
		/// 1. Gather the terrain
		for(var y = 0; y < 50; y++)
		{
			for(var x = 0; x < 50; x++)
			{
	            var info = {terrain:0, spot:SPOT_FREE}
	            var tile = Game.map.getTerrainAt(spot_pos)
	            if(tile == 'wall')
	            	info.terrain = TERRAIN_WALL
	            else if(tile == 'swamp')
	            	info.terrain = TERRAIN_SWAMP
				
				this.tiles[x+y*50] = tile
			}
		}
		
		/// 2. Draw mines and its spots
		if(this.room)
		{
			var data = this
			var filter = function(mine)
			{
				data.mines[mine.id] = {type:'E', x:mine.pos.x, y:mine.pos.y}
				data.mark_area_1(mine.pos.x, mine.pos.y, (tile) => tile.terrain != TERRAIN_WALL ? SPOT_MINE : SPOT_FREE)
				return true
			}
			this.room.find(FIND_SOURCES, {filter:filter})
		}
		

		/// 3. Calculate best position for upgrader chest
		///		iterate through all contour points at distance = 2
		/// 4. Draw upgrader spots
	}
	
	/**
	 * Marks area around specified point using callback
	 * @callback should return spot type
	 */ 
	mark_area_1(x0,y0, callback)
	{
		for(var y = y0-1; y <= y0+1; y++)
		{
			for(var x = x0-1; x <= x0+1; x++)
			{
				if(x == 0 || x == 49 || y == 0 || y == 49)
					continue
				if(x == x0 && y == y0)
					continue
				
				var tile = this.get_tile(x, y)
				var spot = callback(tile, x, y)
				tile.spot = spot
			}
		}
	}
}

/**
 * Lists free spots around this room position
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

/**
 * Remove all the flags from a room
 */
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
 * Plans road from one position to another 
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
	var tiers = [ 0, 0, 250, 500, 1000 ]
	var capacity = this.energyCapacityAvailable
	var capabilities = this.get_capabilities()
	
	/// There is no creep to feed the spawn, so 
	if(!capabilities.feed_spawn)
		capacity = this.energyAvailable
	if(!capabilities.miner)
		capacity = this.energyAvailable
	
	/// TODO: check whether the room has 'mover' capability
	/// effectively making its energy capped at 300 corresponding to t1
	var tier = 1
	
	for(var i = 0; i < tiers.length; i++)
	{
		if((tiers[i] + 300) <= capacity)
		{
			tier = i+1
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

/**
 * Get number of mining spots
 */
Room.prototype.get_mine_spots = function(force)
{
	if(!this.memory.last_mine_calc)
		this.memory.last_mine_calc = Game.time
	
	var spots = 0
	if(force || (Game.time - this.memory.last_mine_calc > 10))
	{
		for(var s in Memory._sources)
		{
			var source = Game.getObjectById(s)
			if(!source || source.pos.roomName != this.name)
				continue
			spots += source.memory.spots
		}
	}
	
	return spots
}

/**
 * Get room capabilities
 * Iterates through all objects in a room 
 * and gathers 'logic' capabilities
 * This capabilities can be used in a 
 * planning system to check current state
 */
Room.prototype.get_capabilities = function(force)
{
	this.memory.capabilities = this.memory.capabilities || {}
	
	if(!this.memory.last_caps_calc)
		this.memory.last_caps_calc = Game.time
	
	if(force || (Game.time - this.memory.last_caps_calc > 10))
	{
		this.memory.capabilities = {}
		var result = this.memory.capabilities
		this.find(FIND_MY_CREEPS, 
		{
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
		    }
		});
		
		this.memory.last_caps_calc = Game.time
		
		//console.log("Recalculated room capabilities: " + JSON.stringify(result))
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

/**
 * Removes all the build sites from a room
 * For testing stuff
 */
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
