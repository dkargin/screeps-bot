module.exports = {};

require('./utils.grid')

/// Terrain type
const TERRAIN_WALL = 1
const TERRAIN_SWAMP = 2
/// Spot type
var SPOT = {
	FREE : 0, 				/// No spot. Can be occupied
	MINE : 1, 				/// Spot near the mine
	MINE_CHEST : 2,			/// Container near the mine
	UPGRADE : 3, 				/// Spot for upgrader creep
	UPGRADE_CHEST : 4, 		/// Container near the upgraders
	RENEW : 5,				/// Renew spot near the spawn
	SPAWN : 6, 				/// New creeps spawn here
	GATE : 7 ,				/// Gate in a wall. Can contain road as well
	EXTENSION : 8,
	ROAD : 9,
	SPAWN_CHEST : 10,			/// Chest nearby spawn. Also works as suicide spot
	EXTENSION : 11, 			/// Position to feed extensions
}

/// Get string name for a spot
var get_spot_name = function(spot)
{
	for(var s in SPOT)
	{
		if(SPOT[s] == spot)
		{
			return s
		}
	}
	return 'Unknown'+spot
}
/// Versions for data storage
const ROOM_DATA_VERSION = 3
const ROOM_DATA_TERRAIN_VERSION = 8
const ROOM_DATA_MINES_VERSION = 5


/// Room roles
const ROOM_ROLE_UNDECIDED = 0
const ROOM_ROLE_CITY = 1
const ROOM_ROLE_CAPITAL = 3
const ROOM_ROLE_REMOTE_MINE = 4
const ROOM_ROLE_PATROL_BORDER = 5

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

// Removes all the flags without specific role
global.remove_flags = function()
{
	for(var f in Game.flags)
	{
        var flag = Game.flags[f]
        if(!flag.memory.role)
		  Game.flags[f].remove()
	}
}

// Removes all construction sites from the room
global.remove_sites = function()
{
	for(var r in Game.rooms)
	{
		var room = Game.rooms[r]
		
		var sites = room.find(FIND_CONSTRUCTION_SITES)
		for(var s in sites)
		{
			var site = sites[s]
			site.remove()
		}
	}
}

global.remove_debug = function()
{
	remove_flags()
	remove_sites()
}


var Database = {}

/// Occupies map cells for specified mine
// @param {Mine} mine
// @param info - persistent room info
// @param {Array} cpos - position of the room's center
function place_mine_spots(mine, info, cpos)
{
	/// Get path to a mine
	var path = cpos.findPathTo(this.room.getPositionAt(mine.x, mine.y), {IgnoreCreeps:true})

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
		
		mine.chest = [finish.x, finish.y]
		
		this.set_spot(...mine.chest, SPOT.MINE_CHEST)
		
		mine.distance_min = path.length
		mine.distance = this.effecive_path_length(path)
		mine.path_bin = Room.serializePath(path)
		/// Draw road
		for(var i = 0; i < path.length-2; i++)
			this.set_spot(path[i].x, path[i].y, SPOT.ROAD)
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
		var len = flat_distance([x, y], mine.chest)
		/// We occupy only spots nearby to the chest
		if(spot == SPOT.FREE && len < 2)
		{
			roomdata.set_spot(x,y, SPOT.MINE)
			console.log("Creating MSPOT " + [x,y] + " len=" + len)
		}
	}
	this.mark_area_1(mine.x, mine.y, iterator)
}

/**
 * Extract terrain data from the game
 * @param {dict} info - persistent room info
 * @param {String} rname - room name
 * @returns [terrain, spots]
 */
function readTerrain(rname)
{
    var terrain = new Array(50*50)
    var spots = {mines:[]}
		
	/// 1. Gather the terrain
	for(var y = 0; y < 50; y++)
	{
		var row = y*50
		for(var x = 0; x < 50; x++)
		{
            var raw_tile = Game.map.getTerrainAt(x,y, rname)
            if(raw_tile == 'wall')
            	terrain[x+row] = TERRAIN_WALL
            else if(raw_tile == 'swamp')
            	terrain[x+row] = TERRAIN_SWAMP
            else
                terrain[x+row] = 0
            //info.spots[x+row] = 0
		}
	}
	
	/// 2. Read data about room structures
	/* Should get something like:
	spots = {
    	mines:[
    		{pos:[34, 20], res:'E'}, 
    		{pos:[30, 21], res:'E'}
    	],
    	controller:{pos:[23, 42]},
    	structures: [[40, 30, CONTROLLER], ...],
    	walls: [[10, 23, 4440], [20, 34, 440005]], ...
    }
    */
	var room = Game.rooms[rname] 
	if(room)
	{
		var filter = function(mine)
		{
			spots.mines.push({res:'E', pos: [mine.pos.x, mine.pos.y], id: mine.id})
			return true
		}

		room.find(FIND_SOURCES, {filter:filter})
		
		var ctrl = room.controller
		spots.controller = {
			level:ctrl.level, 
			pos:[ctrl.pos.x, ctrl.pos.y],
			progress:ctrl.progress,
			total:ctrl.progressTotal
		}
	}
	
	return [terrain, spots]
}

/** 
 * Finds the best position for upgrader chest
 * @param cx, cy - coordinate of controller
 * @param room - {Room} to investigate
 * @param terrain - {Grid} with the terrain
 * @param spots - {Grid} with projected room spots
 */
function findBestUpgraderSpot(cx, cy, room, terrain, spots)
{
	var uspots = []
	
	/// 1. Search for the best upgrader spot
	for(var i in contour_2)
	{
		var delta = contour_2[i]
		var [x,y] = [cx + delta[0], cy + delta[1]]
		
		var nspots = 0
		var valid = true

		if(this.is_occupied(x,y))
			continue
		
		for(var y0 = y-1; y0 <= y+1; y0++)
		{
			for(var x0 = x-1;x0 <= x+1; x0++)
			{
				var t = terrain.get(x0, y0)
				var spot = spots.get(x0, y0)
				/// Check chest spot
				if(x0 == x && y0 == y)
				{
					/// Check if chest can be placed here
					if( t == TERRAIN_WALL || spot != SPOT.FREE)
						valid = false
				}
				else if(spot != SPOT.MINE && spot != SPOT.MINE_CHEST)
				{
					nspots++
				}
			}
		}
		
		if(!valid || nspots < 4)
		{
			continue
		}
		
		uspots.push(room.getPositionAt(x,y))
	}
	
	var centerPos = room.getPositionAt(...info.center)
	var closest = centerPos.findClosestByPath(uspots, {IgnoreCreeps:true})
	return closest
}

/**
 * RoomLayout class
 * contains cache for room contents, even for a room that is not accessible, 
 * but visited recently
 */
class RoomLayout
{
	constructor(name)
	{
	    if (!_.isString(name))
	        throw new Error("Invalid name, it should be a string, not " + name)
	        
		console.log("Creating RoomLayout for " + name + " at tick " + Game.time)
		this.name = name
		
		Memory.rooms = Memory.rooms || {}
		Memory.rooms[name] = Memory.rooms[name] || {}
		
		this.room = Game.rooms[name]
		
		var def = {
			mines: {}, 
			economy:{},
			lairs:{},
			mine_version: ROOM_DATA_MINES_VERSION,
			terrain_version: ROOM_DATA_TERRAIN_VERSION,
			version: ROOM_DATA_VERSION,
		}
		
		var info = _.defaults(Memory.rooms[name], def)
		Memory.rooms[name] = info

		// Extracted terrain
		this.terrain = new Grid(50, 50)
		// Room spots that were projected to the grid
		this.flatSpots = new Grid(50, 50)
		
		if (this.room)
		{
			var spawns = room.find(FIND_MY_SPAWNS)
			this.spawns = spawns
		}
		
		if (!'role' in info)
		{			
			//console.log("AI Tick " + Game.time + " room " + rname + " pop=" + JSON.stringify(population) + " caps=" + JSON.stringify(room.get_capabilities(true)) + " tier=" + room.get_tech_tier() + " cap="+room.energyCapacityAvailable)	
			if(spawns.length > 0)
			{
				//console.log("No spawns at room " + rname)
				info.role = ROOM_ROLE_CITY
			}
			else
			{
				info.role = ROOM_ROLE_UNDECIDED
			}
		}
		
		this.structures = this.structures || []
		this.terrain_viz = new RoomVisual(name)
		this.stat_viz = new RoomVisual(name)
		this.costmap = Array(50*50)
	}
	
	/**
	 * Get attached room info from persistent memory
	 */
	get_persistent_info()
	{
		return Memory.rooms[this.name]
	}

	/**
	 * Check whether room is available for scanning
	 */
	is_available()
	{
		return _.isObject(this.room)
	}
	
	/**
	 * Check whether the room is fully explored
	 */
	is_explored()
	{
		var info = this.get_persistent_info()
		return !_.isNull(info)
	}
	
	read_structures()
	{

	}
	
	/**
	 * Get RoomPosition of the logistics center
	 */
	getLogisticsCenter()
	{
		return new RoomPosition(this.center[0], this.center[1], this.name)
	}

	/// Check if a coordinate is occupied by any sort of building
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

	/// Read terrain and generate proper spots
	*map_analyser_thread()
	{	
		console.log("Started room " + this.name + " analysis")
		var [terrain, initialSpots] = readTerrain(this.name)
		this.terrain = terrain
		this.costmap = terrainToCostmap(terrain, 50, 50)
		
		yield* OS.break();
		var calculator = new RoomSpotsCalculator(this.costmap, initialSpots, 50, 50);
    	var process = calculator.process(this)
    	
    	var result = {}
    	do
    	{
    		result = process.next();
    		yield* OS.break();
    	}while(result && !result.done)
		
		//this.save_memory()
	}

	/// Draw room visuals
	draw_room_info()
	{
		//console.log("Drawing room " + this.room.name + " data")
		var vis = this.room.visual
		var stat = {}
		
		
		for(var y = 0; y < 49; y++)
		{
			for(var x = 0; x < 49; x++)
			{
			    /*
				var spot = this.get_spot(x,y)
				switch(spot)
				{
					case SPOT.ROAD: vis.text("+", x,y); break;
					case SPOT.MINE: vis.text("m", x,y); break;
					case SPOT.MINE_CHEST: vis.text("M", x,y); break;
					case SPOT.UPGRADE: vis.text("u", x,y); break;
					case SPOT.UPGRADE_CHEST: vis.text("U", x,y); break;
				}
				var name = get_spot_name(spot)
				if(stat[name])
					stat[name]++
				else
					stat[name] = 1
					*/
				var cost = this.costmap[x+y*50]
				if (cost)
				    vis.text(cost, x, y);
			}
		}
		
		//this.update_stat_visuals()
	}
	
	update_stat_visuals()
	{
	    var viz = this.stat_viz
	    viz.clear()
	    var index = 0
	    var text_left = 1
	    var style = {align:"left"}
	    var room = this.room
	    if (room)
	    {
	        var caps = room.get_capabilities(true)
	        viz.text("caps:", text_left, index++, style)
	        for (var i in caps)
	            viz.text(" -"+i+":"+caps[i], text_left, index++, style)
	        
	        var tier = room.get_tech_tier()
	        viz.text("tier:"+tier, text_left, index++, style)
	        var limit = room.energyCapacityAvailable
	        viz.text("elimit:"+limit, text_left, index++, style)
	        
	    }    
	    
	    for(var key in this.stat)
	    {
	        
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
 * Get number of mining spots in this room
 */
global.get_mine_spots = function(rname, force)
{
    if (!_.isString(rname))
        throw "get_mine_spots: Should provide room name"
	if(!this.last_mine_calc)
		this.last_mine_calc = Game.time
		
	var roomdata = get_room_data(rname)
	var info = roomdata.get_persistent_info()
	/*
	var spots = 0
	//if(force || (Game.time - this.last_mine_calc > 10))
	{
	    console.log("Recalculating mine spots for a room "+this.name)
		for(var s in Memory._sources)
		{
			var source = Game.getObjectById(s)
			if(!source || source.pos.roomName != this.name)
				continue
			spots += source.memory.spots
		}
	}*/
	
	//console.log("Searching for mines in " + rname + ": " + JSON.stringify(info.mines))
	return _.size(info.mines)
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
		var creeps = this.find(FIND_MY_CREEPS);
		
		for(var i in creeps)
		{
		    var creep = creeps[i]
		    var caps = creep.getCapabilities()
	    	append_table(result, caps)
		}
		
		this.memory.last_caps_calc = Game.time
		
		//console.log("Recalculated room capabilities: " + JSON.stringify(result))
	}
	return this.memory.capabilities
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

global.get_room_data = function(name)
{
    if (!_.isString(name))
        throw("get_room_data(" + name + ") - name should be a string") 
    if(!Database[name])
		Database[name] = new RoomLayout(name)
	return Database[name]
}

function getRandomFreePos(startPos, distance) 
{
    var x,y;
    do {
        x = startPos.x + Math.floor(Math.random()*(distance*2+1)) - distance;
        y = startPos.y + Math.floor(Math.random()*(distance*2+1)) - distance;
    }
    while((x+y)%2 != (startPos.x+startPos.y)%2 || Game.map.getTerrainAt(x,y,startPos.roomName) == 'wall');
    return new RoomPosition(x,y,startPos.roomName);
}

function build(spawn, structureType)
{
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
