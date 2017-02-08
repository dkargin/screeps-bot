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
const SPOT_ROAD = 9

/// Versions for data storage
const ROOM_DATA_VERSION = 1
const ROOM_DATA_TERRAIN_VERSION = 1
const ROOM_DATA_MINES_VERSION = 3

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

var Database = {}
/**
 * RoomData class
 * contains cache for room contents, even for a room that is not accessible, 
 * but visited recently
 */

global.coords2str = function(x,y)
{
	return "X"+x+"Y"+y
}

/**
 * Get flat distance between two points
 */
function flat_distance(a,b)
{
	var dx = Math.abs(a.x - b.x)
	var dy = Math.abs(a.y - b.y)
	return Math.max(dx, dy)
}

class RoomData
{
	constructor(name)
	{
		this.name = name
		Memory.room_data = Memory.room_data || {}
		
		Memory.room_data[this.name] = Memory.room_data[this.name] || {}
		
		var info = Memory.room_data[this.name]
		
		this.room = Game.rooms[this.name]
		var def = {
			mines: {}, 
			economy:{},
			lairs:{},
		}
		_.defaults(info, def)
		
		if(!info.terrain || !info.terrain.length)
			info.terrain = new Array(50*50)

		if(!info.spots || !info.spots.length)
			info.spots = new Array(50*50) 

		this.terrain = info.terrain
		this.spots = info.spots
		this.structures = this.structures || []
	}
	
	/**
	 * Get attached room info from persistent memory
	 */
	get_info()
	{
		return Memory.room_data[this.name]
	}
	
	/**
	 * Check whether room is available for scanning
	 */
	is_available()
	{
		return _.isObject(this.room)
	}
	
	/**
	 * Get a single tile
	 */
	get_terrain(x,y)
	{
		return this.terrain[x + y*50]
	}

	set_terrain(x,y, t)
	{
		this.terrain[x+y*50] = t
	}

	get_spot(x,y)
	{
		return this.spots[x+y*50]
	}

	set_spot(x,y, s)
	{
		this.spots[x+y*50] = s
	}
	
	/**
	 * Check whether the room is fully explored
	 */
	is_explored()
	{
		var info = this.get_info()
	}
	
	read_structures()
	{

	}
	/**
	 * Read terrain data
	 */
	read_terrain()
	{
		var info = this.get_info()
		/// Do not read room data if we have already one
		if(info.terrain_version && info.terrain_version == ROOM_DATA_TERRAIN_VERSION)
		{
			console.log("Room " + this.name + " terrain is already scanned")
			return
		}
			
		var rname = this.name
		/// 1. Gather the terrain
		for(var y = 0; y < 50; y++)
		{
			var row = y*50
			for(var x = 0; x < 50; x++)
			{
	            var raw_tile = Game.map.getTerrainAt(x,y, rname)
	            if(raw_tile == 'wall')
	            	this.terrain[x+row] = TERRAIN_WALL
	            else if(raw_tile == 'swamp')
	            	this.terrain[x+row] = TERRAIN_SWAMP
	            this.spots[x+row] = 0

	            /*
	            var objects = this.room.lookForAt(LOOK_STRUCTURE, x, y)
	            for(var i in objects)
	            {
	            	var obj = objects[i]
	            }*/
			}
		}
		
		/// 2. Read data aboud room structures
		if(this.room)
		{
			var filter = function(mine)
			{
				info.mines[mine.id] = {type:'E', x:mine.pos.x, y:mine.pos.y}		
				return true
			}

			this.room.find(FIND_SOURCES, {filter:filter})
			
			var ctrl = this.room.controller
			info.controller = {
				level:ctrl.level, 
				x:ctrl.pos.x, 
				y:ctrl.pos.y,
				progress:ctrl.progress,
				total:ctrl.progressTotal
			}
		}
		
		info.terrain_version = ROOM_DATA_TERRAIN_VERSION
		console.log("Scanned room " + this.name + " terrain")
	}

	/// Get RoomPosition of logistics center
	get_logistics_center(info)
	{
		if(!info)
			info = this.get_info()
		return new RoomPosition(info.center[0], info.center[1], this.name)
	}
	
	/// Occupies map cells for specified mine
	place_mine_spots(mine, info)
	{
		/// Get room center position
		var cpos = this.get_logistics_center(info)
		/// Get path to a mine
		var path = cpos.findPathTo(this.room.getPositionAt(mine.x, mine.y), {ignoreCreeps:true})

		/* TODO: 
		Since we occupy spots near both mine and chest, there can be better 
		solutions for chest placing, allowing more mining spots. It can improve 
		performance on lower tiers. 
		Right now we pick chest position from the final point of path from 
		logistics center to the mine
		*/
		/// 1. Find chest location
		if(path.length > 1)
		{
			var finish = path[path.length-2];
			
			mine.spot = [finish.x, finish.y]
			//var fname = "MSpot"+coords2str(...mine.spot)
			//this.room.createFlag(...mine.spot, fname, COLOR_RED)

			this.set_spot(...mine.spot, SPOT_MINE_CHEST)
			
			mine.distance_min = path.length
			mine.distance = this.effecive_path_length(path)
			mine.path_bin = Room.serializePath(path)
			for(var i = 0; i < path.length-3; i++)
				this.set_spot(path[i].x, path[i].y, SPOT_ROAD)
		}
		else
		{
			console.log("No path to mine " + coords2str(mine.x, mine.y))
		}
		
		mine.distance = this.effecive_path_length(path)

		/// 2. Occupy spots for a mine
		var roomdata = this
		var iterator = function(x, y)
		{
			if(roomdata.get_terrain(x, y) == TERRAIN_WALL)
				return
			var spot = roomdata.get_spot(x,y)
			var len = flat_distance({x:x, y:y}, mine.spot)
			/// We occupy only spots nearby to the chest
			if(spot == SPOT_FREE && len < 2)
			{
				roomdata.set_spot(x,y, SPOT_MINE)
				roomdata.room.createFlag(x, y, fname, COLOR_GREEN)
			}
		}
		this.mark_area_1(mine.x, mine.y, iterator)
	}
	
	*process_mines(info)
	{
		console.log("Mine version="+info.mine_version + " D="+JSON.stringify(info))
		
		if(info.mine_version && info.mine_version == ROOM_DATA_MINES_VERSION)
		{
			console.log("Room " + this.name + " mine data is already calculated")
			return
		}
		
		for(var m in info.mines)
		{
			yield "calculating path to mine " + m
			this.place_mine_spots(info.mines[m], info)
		}

		info.mine_version = ROOM_DATA_MINES_VERSION

		console.log("mine spots calculation is complete, ver=" + info.mine_version)
	}
	
	place_upgrader_slots(info)
	{
		var info = this.get_info()
		var centerPos = new RoomPosition(info.center[0], info.center[1], this.name)
	}

	/// Check if coordinate is occupied by any sort of building
	is_occupied(x, y)
	{
		var structures = this.room.lookForAt(LOOK_STRUCTURES, x, y)
		for(var i in structures)
		{
			var structure = structures[i]
			if(structure.structureType != STRUCTURE_CONTAINER)
				return true;
		}
		return false
	}

	/// Finds best position for upgrader chest
	find_best_upgrader_spot(info)
	{
		var uspots = []
		/// 1. Search for the best upgrader spot
		for(var i in contour_2)
		{
			var delta = contour_2[i]
			var [x,y] = [info.controller.x + delta[0], info.controller.y + delta[1]]
			
			var nspots = 0
			var valid = true

			if(this.is_occupied(x,y))
				continue
			
			for(var y0 = y-1; y0 <= y+1; y0++)
			{
				for(var x0 = x-1;x0 <= x+1; x0++)
				{
					var terrain = this.get_terrain(x0, y0)
					var spot = this.get_spot(x0, y0)
					/// Check chest spot
					if(x0 == x && y0 == y)
					{
						/// Check if chest can be placed here
						if( terrain == TERRAIN_WALL || spot != SPOT_FREE)
							valid = false
					}
					else if(spot != SPOT_MINE && spot != SPOT_MINE_CHEST)
					{
						nspots++
					}
				}
			}
			
			if(!valid || nspots < 4)
			{
				continue
			}
			
			uspots.push(this.room.getPositionAt(x,y))
		}
		
		var centerPos = this.room.getPositionAt(...info.center)
		var closest = centerPos.findClosestByPath(uspots, {IgnoreCreeps:true})
		return closest
	}

	/// Calculates room logistics center
	calc_logistics_center(info)
	{
		var objs=this.room.find(FIND_STRUCTURES, {filter: { structureType: STRUCTURE_STORAGE }})
		if(objs.length > 0)
		{
			return [objs[0].pos.x, objs[0].pos.y]
		}

		/// TODO: calculate proper logistics center using wave distance generator
		return [25, 25]
	}
	
	/// Read terrain and generate proper spots
	*map_analyser()
	{	
		this.read_terrain()
	
		yield "read_terrain"
			
		var info = this.get_info()
		
		info.center = this.calc_logistics_center(info)
		
		this.room.createFlag(...info.center, "LCenter", COLOR_YELLOW)
		
		yield *this.process_mines(info)
		
		/**
		 * Need best spot for chest:
		 * 	- no adjacent positions are mine spots
		 */ 
		var closest = this.find_best_upgrader_spot(info)
		if(closest)
		{
			this.room.createFlag(closest.x,closest.y, "UChest")
			info.uspot = [closest.x, closest.y]
			this.set_spot(...info.uspot, SPOT_UPGRADE_CHEST)
		}

		var cpos = this.get_logistics_center(info)
		/// Get path to a mine
		var path = cpos.findPathTo(this.room.getPositionAt(closest.x, closest.y),{ignoreCreeps:true})
		
		if(path && path.length > 2)
		{

		}
		else
		{
			console.log("ERROR: failed to find best path for upgrader spots")
		}		
		/// 3. Calculate best position for upgrader chest
		///		iterate through all contour points at distance = 2
		/// 4. Draw upgrader spots
		
		yield "Generating upgrader spots"
	}

	/// Draw room visuals
	draw_room_info()
	{
		var vis = this.room.visual
		for(var y = 0; y < 49; y++)
		{
			for(var x = 0; x < 49; x++)
			{
				var spot = this.get_spot(x,y)
				switch(spot)
				{
					case SPOT_ROAD: vis.text("R", x,y); break;
					case SPOT_MINE: vis.text("m", x,y); break;
					case SPOT_MINE_CHEST: vis.text("M", x,y); break;
					case SPOT_UPGRADE: vis.text("u", x,y); break;
					case SPOT_UPGRADE_CHEST: vis.text("U", x,y); break;
				}
				
			}
		}
	}
	
	/**
	 * Calculate effective path length
	 */
	effecive_path_length(path)
	{
		var distance = 0
		for(var i = 0; i < path.length; i++)
		{
			var terrain = this.get_terrain(path[i].x, path[i].y)
			distance += (terrain == TERRAIN_SWAMP ? 5 : 1)	
		}
		return distance
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
				callback( x, y)
			}
		}
	}
	
	/**
	 * Check 3x3 area
	 * @returns true if all cells inside pass the check
	 */
	check_area(x0, y0, size,  callback)
	{
		for(var y = y0-size; y <= y0+size; y++)
		{
			for(var x = x0-size; x <= x0+size; x++)
			{
				if(x == 0 || x == 49 || y == 0 || y == 49)
					continue				
				var tile = this.get_tile(x, y)
				if(!callback(tile, x, y))
					return false
			}
		}
		return true
	}
	
	show_markers()
	{
		return
		var room = Game.rooms[this.name]
		if(!room)
			return
			
		var info = this.get_info()
		
		for(var m in info.mines)
		{
			room.createFlag(m.x, m.y, "MSpot#"+name+"X"+m.x + "Y"+m.y)
		}
		
		room.createFlag(m.x, m.y, "USpot#"+name+"X"+m.x + "Y"+m.y)
	}
}

global.show_markers = function()
{
	for(var r in Database)
	{
		var data = Database[r]
		data.show_markers()
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
	var tiers = [ 0, 250, 500, 1000 ]
	var capacity = this.energyCapacityAvailable
	var capabilities = this.get_capabilities()
	
	/// There is no creep to feed the spawn, so 
	if(!capabilities.feed_spawn)
	{
		//console.log("No units of role feed_spawn. Limiting capacity")
		capacity = Math.max(this.energyAvailable, 300)
	}
	if(!capabilities.mine)
	{
		//console.log("No units of role miner. Limiting capacity")
		capacity = Math.max(this.energyAvailable, 300)
	}
	
	/// TODO: check whether the room has 'mover' capability
	/// effectively making its energy capped at 300 corresponding to t1
	var tier = 1
	
	for(var i = 0; i < tiers.length; i++)
	{
		var limit = (tiers[i] + 300)
		if( limit <= capacity)
		{
			tier = 1+i
			//console.log("Picking tier = " + tier)
		}
		else
		{
			//console.log("ntier = " + i + " is over current capacity=" + capacity + " with limit=" + limit)
		}
	}
	
	if(this.controller.level < tier)
		tier = this.controller.level
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

var Utils = {
	init : function()
    {
        
    },
    get_room_data : function(name)
    {
    	if(!Database[name])
    		Database[name] = new RoomData(name)
    	return Database[name]
    },
}

module.exports = Utils;
