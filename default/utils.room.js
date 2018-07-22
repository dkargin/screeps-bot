module.exports = {};

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
const ROOM_DATA_VERSION = 2
const ROOM_DATA_TERRAIN_VERSION = 5
const ROOM_DATA_MINES_VERSION = 5


/// Room roles
var ROOM_ROLE = {
	PASSAGE :0, 			/// Just a passage. No usefull resources
	REMOTE_RESOURCE : 1,	/// We can do remote mining here
	CITY :2,				/// Room to be claimed
}

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

global.coords2str = function(x,y)
{
	return "X"+x+"Y"+y
}

/// Converts string, like X10Y34 to array with coordinates [10, 34]
global.str2coords = function(packed)
{
    var patt = /X(\d+)Y(\d+)/;
    var matches = packed.match(patt)
    if(matches && matches.length == 3)
       return [Number(matches[1]), Number(matches[2])]
}

/**
 * Get flat distance between two points, defined by an array a=[ax,ay], b=[bx,by]
 */
global.flat_distance = function(a,b)
{
	var dx = Math.abs(a[0] - b[0])
	var dy = Math.abs(a[1] - b[1])
	return Math.max(dx, dy)
}

global.remove_flags = function()
{
	for(var f in Game.flags)
	{
        var flag = Game.flags[f]
        if(!flag.memory.role)
		  Game.flags[f].remove()
	}
}

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

// Generic 2d grid
class Grid
{
    constructor(width, initial=null)
    {
        this.width = width
        this.data = new Array(width*width)
        for (var i = 0; i < width*width; i++)
            this.data[i] = initial
    }
    
    get(x,y)
	{
	    // TODO: Get data from memory cache
		//var info = this.get_persistent_info()
		this.data[x + y*this.width]
	}

	set(x, y, t)
	{
		//if(!Number.isInteger(t))
		//	throw new Error("RoomData.set_terrain("+x+","+y + ","+t + ") - invalid terrain type")
		//var info = this.get_persistent_info()
		this.data[x+y*this.width] = t
	}
	
	// Serializes grid to string
	serialize()
	{
		var output = ""
		var width = this.width
		for(var y = 0; y < width; y++)
		{
			var row = ""
			for(var x = 0; x < width; x++)
			{
				//row[x] = data[x + y*50]
				row = row + this.data[x+y*50]
			}
			row = row + '\n'
			output = output + row
		}
		return output
	}
	
	// Deserialize string. Actual size is calculated by getting number of rows
	deserialize(raw_data)
	{
		var rows = raw_data.split('\n')
		var width = rows.length
		var result = new Array(width*width)
		var i = 0
		for(var y = 0; y < width; y++)
		{
			var row = rows[y]
			var lim = Math.min(width, row.length)
			for(var x = 0; x < lim; x++)
				result[i++] = row[x]
		}
		
		this.data = result
		this.width = width
	}
}

/**
 * RoomData class
 * contains cache for room contents, even for a room that is not accessible, 
 * but visited recently
 */
class RoomData
{
	constructor(name)
	{
	    if (!_.isString(name))
	        throw new Error("RoomData.constructor invalid name, it should be a string, not " + name)
	        
		console.log("Creating RoomData for " + name + " at tick " + Game.time)
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

		var lim = 50*50

		if(!info.terrain || info.terrain.length != lim)
		{
		    console.log(" - initializing terrain")
			info.terrain = new Array(lim)
			for(var i = 0; i < lim; i++)
				info.terrain[i] = 0
		}

		if(!info.spots || info.spots.length != lim)
		{
		    console.log(" - initializing spots")
			info.spots = new Array(lim)
			for(var i = 0; i < lim; i++)
				info.spots[i] = 0
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
	 * Get a single tile
	 */
	get_terrain(x,y)
	{
	    // TODO: Get data from memory cache
		var info = this.get_persistent_info()
		return info.terrain[x + y*50]
	}

	set_terrain(x,y, t)
	{
		if(!Number.isInteger(t))
			throw new Error("RoomData.set_terrain("+x+","+y + ","+t + ") - invalid terrain type")
		var info = this.get_persistent_info()
		info.terrain[x+y*50] = t
	}

    /**
     * Get building spot
     */
	get_spot(x,y)
	{
		var info = this.get_persistent_info()
		return info.spots[x+y*50]
	}

	set_spot(x,y, s)
	{
		if(!Number.isInteger(s))
			throw new Error("RoomData.set_terrain("+x+","+y + ","+s + ") - invalid spot type")
		
		//console.log("Setting spot pos="+x+":" + y + " to=" + s)
		var info = this.get_persistent_info()
		info.spots[x+y*50] = s
	}

	clear_spots()
	{
		console.log("RoomData("+this.name+")::clear_spots()")
		var info = this.get_persistent_info()
		var len = info.spots.length
		for(var i = 0; i < len; i++)
			info.spots[i] = SPOT.FREE
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
	 * Extract terrain data from game
	 */
	read_terrain()
	{
		var info = this.get_persistent_info()
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
	            	info.terrain[x+row] = TERRAIN_WALL
	            else if(raw_tile == 'swamp')
	            	info.terrain[x+row] = TERRAIN_SWAMP
	            else
	                info.terrain[x+row] = 0

	            info.spots[x+row] = 0

	            /*
	            var objects = this.room.lookForAt(LOOK_STRUCTURE, x, y)
	            for(var i in objects)
	            {
	            	var obj = objects[i]
	            }*/
			}
		}
		
		/// 2. Read data about room structures
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


	/// Calculates room logistics center
	*calc_logistics_center(info)
	{
	    var terrain = info.terrain
	    
	    // Returns walking cost for specified tile
	    var costmap = new Array(50*50)
	    for(var i = 0; i < 50*50; i++)
	    {
	        var tile = terrain[i]
		    if (tile == 0)
		        costmap[i] = 1
		    else if (tile == TERRAIN_SWAMP)
		        costmap[i] = 5
		    else costmap[i] = 100
	    }
	    
		
		var wave = new MultiWave(costmap, 50)
		var mines = []
		
		for(var i in info.mines)
		{
		    var mine = info.mines[i]
		    var mine_tag = "mine@"+i
		    mines.push(mine_tag)
		    wave.addWave(mine.x, mine.y, mine_tag, 0)
		}
		
		wave.addWave(info.controller.x, info.controller.y, "controller", 0)
		
		var iterations = 0
		var period = 10;
		do
		{
		    var result = wave.runOnce();
		    var total = result.total
		    if (total == 0)
		        break;
		    iterations++;
		    console.log("Wave analyser discovered " + total + " nodes at iteration" + iterations + " colors=" + JSON.stringify(result.colors))
		    if (iterations > period)
		    {
		        yield* OS.break();    
		        iterations = 0;
		    }
		}while(true)
		
		console.log("Done after " + iterations + " iterations");
		
		var best
		var bestCost = 1000
		var searched = 0;
		
		var width = 50;
		
		var calcCost = function(costs)
		{
		    var sources = 0
		    for(var i in mines)
		    {
		        var node = costs[mines[i]];
		        if (!node)
		            continue;
		        sources = sources + node.cost
		    }
		    
		    var consumers = 0
		    if ('controller' in costs)
		    {
		        consumer = consumers + costs['controller']
		    }
		    
		    return sources - consumer
		}
		
		for(var x = 0; x < width; x++)
		{
    	    for(var y = 0; y < width; y++)
    	    {
    	        // This is a map color->node
    	        var nodes = wave.getNodes(x,y)
    	        var cost = calcCost(nodes)
    	        
    	        this.costmap[x+y*width] = cost
    	        
    	        if (cost < bestCost)
    	        {
    	            bestCost = cost;
    	            best = [x, y, cost]
    	        }
    	        
    	        searched ++;
    	    }
		}
		
		if (best)
		    console.log("Best center x="+best[0]+" y=" + best[1] + " cost="+best[2])
		
		// Consider storage to be a center
		var objs=this.room.find(FIND_STRUCTURES, {filter: { structureType: STRUCTURE_STORAGE }})
		if(objs.length > 0)
		{
			return [objs[0].pos.x, objs[0].pos.y]
		}

        // Consider spawn to be a center
		objs = this.room.find(FIND_STRUCTURES, {filter: { structureType: STRUCTURE_SPAWN }})
		if(objs.length > 0)
		{
			return [objs[0].pos.x, objs[0].pos.y]
		}
		
		return [25, 25]
	}

	/// Get RoomPosition of logistics center
	get_logistics_center(info)
	{
		if(!info)
			info = this.get_persistent_info()
		return new RoomPosition(info.center[0], info.center[1], this.name)
	}

	/// Occupy spawn spots
	place_spawn_spots(info)
	{

	}
	
	/// Occupies map cells for specified mine
	place_mine_spots(mine, info, cpos)
	{
		/// Get path to a mine
		var path = cpos.findPathTo(this.room.getPositionAt(mine.x, mine.y), this.get_road_opts())

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
	
	// TODO: Make this function reentrable, without references to yieldOS
	*process_mines(info)
	{
		console.log("Mine version="+info.mine_version + " D="+JSON.stringify(info))
		
		if(info.mine_version && info.mine_version == ROOM_DATA_MINES_VERSION)
		{
			console.log("Room " + this.name + " mine data is already calculated")
			return
		}

		this.clear_spots()
		
		yield* OS.break()
		
		/// Get room center position
		var cpos = this.get_logistics_center(info)
		
		for(var m in info.mines)
		{
			this.place_mine_spots(info.mines[m], info, cpos)
			yield* OS.break()
		}

		info.mine_version = ROOM_DATA_MINES_VERSION

		console.log("mine spots calculation is complete, ver=" + info.mine_version)
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
	find_best_upgrader_chest_spot(info)
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
						if( terrain == TERRAIN_WALL || spot != SPOT.FREE)
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
			
			uspots.push(this.room.getPositionAt(x,y))
		}
		
		var centerPos = this.room.getPositionAt(...info.center)
		var closest = centerPos.findClosestByPath(uspots, this.get_road_opts())
		return closest
	}
	
	/// Place spots for UpgradeCorp
	place_upgrader_spots(info)
	{
		/**
		 * Need best spot for chest:
		 * 	- no adjacent positions are mine spots
		 */ 
		if(!this.room.controller)
		{
			console.log("No room controller at " + this.name)
			return
		}

		var closest = this.find_best_upgrader_chest_spot(info)
		if(closest)
		{
			info.uspot = [closest.x, closest.y]
			this.set_spot(...info.uspot, SPOT.UPGRADE_CHEST)
			console.log("Upgrader spot=" + info.uspot)
		}
		else
		{
			throw new Error("ERROR: no valid spot for upgrader chest")
		}

		var cpos = this.get_logistics_center(info)
		/// Get path to upgrader chest
		var path = cpos.findPathTo(this.room.getPositionAt(closest.x, closest.y), this.get_road_opts())
		
		if(path && path.length > 2)
		{
			/// Draw road
			for(var i = 0; i < path.length-1; i++)
				this.set_spot(path[i].x, path[i].y, SPOT.ROAD)
		}
		else
		{
			throw new Error("ERROR: failed to find best path for upgrader from " + JSON.stringify(cpos) + " to " + JSON.stringify(closest))
		}		

		var roomdata = this
		var iterator = function(x, y)
		{
			if(roomdata.get_terrain(x, y) == TERRAIN_WALL)
				return
			var spot = roomdata.get_spot(x,y)
			/// We occupy only spots nearby to the chest
			if(spot == SPOT.FREE)
			{
				roomdata.set_spot(x,y, SPOT.UPGRADE)
			}
		}
		this.mark_area_1(...info.uspot, iterator)
	}

	/// Read terrain and generate proper spots
	*map_analyser_thread()
	{	
		console.log("Started room " + this.name + " analysis")
		this.read_terrain()
		
		var info = this.get_persistent_info()
		
		info.center = yield* this.calc_logistics_center(info)

		this.place_spawn_spots(info)
		
		yield *this.process_mines(info)
		
		this.place_upgrader_spots(info)
		//yield "Saving memory"
		//this.save_memory()
	}

	get_road_opts()
	{
		//avoid
		this.road_opts = this.road_opts || {IgnoreCreeps:true}
		//this.road_opts.avoid = []
		return this.road_opts
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

	/// Run wave algorithm to generate distance distance map
	generate_wave_cost(start, filter)
	{
		var costs = PathFinder.CostMatrix()
		var wave = []

		return costs
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
		Database[name] = new RoomData(name)
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

function getAdjacent(x, y, width)
{
    var adjacent = []
    for(var y0 = y-1; y0 <= y+1; y0++ )
    {
        for(var x0 = x-1; x0 <= x+1; x0++ )
        {
            if (x0 < 0 || x0 >= width)
                continue;
            if (y0 < 0 || y0 >= width)
                continue
            if (x0 == x && y0 == y)
                continue
            adjacent.push(x0 + y0 * width);
        }
    }
    return adjacent
}

class MultiWave
{
    //Initializes a wave
    //@param terrain - flat 2d array with terrain costs
    //@param width - terrain width
    constructor(terrain, width)
    {
        this.terrain = terrain
        this.width = width
        
        // Wave grid
        this.grid = []
        // Map from color to a grid index
        this.colors = {}
    }
    
    addWave(x, y, color, cost)
    {
        var index = 0
        if (color in this.colors)
        {
            index = this.colors[color]
        }
        else
        {
            index = this.grid.length
            this.grid.push(new Array(this.width*this.width))
            this.colors[color] = index
        }
        
        console.log("Added new color="+color+" to multiwave wave at " + [x,y] + " index=" + index)
        var grid = this.grid[index]
        grid[x + y*this.width] = {x:x, y:y, cost:cost, prev:null, initial:true}
    }
    
    // Simplistic wave propagation. No queue.
    //@returns number of nodes processed
    runOnce()
    {
        var width = this.width
        var terrain = this.terrain
        var grids = this.grid
        var processed_total = 0
        var processed = {}
        
        var numWaves = this.grid.length
        
        for (var i = 0; i < numWaves; i++)
            processed[i] = 0
        
        for(var y = 0; y < width; y++)
        {
            for(var x = 0; x < width; x++)
            {
                var index = x+y*width
                var cost = terrain[index]
                if (cost < 0)
                {
                    continue;
                }
                
                // Contains direct indexes in grid array
                var adjacent = getAdjacent(x, y, width)
                
                for(var i = 0; i < numWaves; i++)
                {
                    var grid = grids[i]
                    if (!grid)
                        throw new Error("no grid for index" + i)
                        
                    var node = grid[x+y*width]
                
                    if (!node)
                        continue;
                        
                    for(var j in adjacent)
                    {
                        var adj = adjacent[j]
                        
                        var adjNode = grid[adj]
                        var newcost = node.cost + cost
                        if (adjNode)
                        {
                            if (adjNode.cost > newcost)
                            {
                                adjNode.cost = newcost;
                                adjNode.from = node
                                processed_total++
                                processed[i] = processed[i] + 1
                            }
                        }
                        else
                        {
                            console.log("Creating node color=" + i + " from ["+x+","+y+"] to adj="+adj + " cost="+newcost)
                            grid[j] = {cost:newcost, from: node, initial:false}
                            processed_total++
                            processed[i] = processed[i] + 1
                        }
                    }
                }
            }
        }
        
        return {total: processed_total, colors:processed}
    }
    
    // Get final cost
    // Returns a map {color->node}
    getNodes(x, y)
    {
        var result = {}
        for (var color in this.colors)
        {
            var grid = this.grid[this.colors[color]]
            result[color] = grid
        }
        return result
    }
} // class MultiWave

/**
 * FastPriorityQueue.js : a fast heap-based priority queue  in JavaScript.
 * (c) the authors
 * Licensed under the Apache License, Version 2.0.
 *
 * Speed-optimized heap-based priority queue for modern browsers and JavaScript engines.
 *
 * Usage :
         Installation (in shell, if you use node):
         $ npm install fastpriorityqueue

         Running test program (in JavaScript):

         // var FastPriorityQueue = require("fastpriorityqueue");// in node
         var x = new FastPriorityQueue();
         x.add(1);
         x.add(0);
         x.add(5);
         x.add(4);
         x.add(3);
         x.peek(); // should return 0, leaves x unchanged
         x.size; // should return 5, leaves x unchanged
         while(!x.isEmpty()) {
           console.log(x.poll());
         } // will print 0 1 3 4 5
         x.trim(); // (optional) optimizes memory usage
 */
"use strict";

var defaultcomparator = function (a, b) {
    return a < b;
};

// the provided comparator function should take a, b and return *true* when a < b
class FastPriorityQueue
{
    constructor(comparator)
    {
        this.array = [];
        this.size = 0;
        this.compare = comparator || defaultcomparator;
    }

    // Add an element the the queue
    // runs in O(log n) time
    add(myval)
    {
        var i = this.size;
        this.array[this.size] = myval;
        this.size += 1;
        var p;
        var ap;
        while (i > 0) {
            p = (i - 1) >> 1;
            ap = this.array[p];
            if (!this.compare(myval, ap)) {
                 break;
            }
            this.array[i] = ap;
            i = p;
        }
        this.array[i] = myval;
    };
    
    // replace the content of the heap by provided array and "heapifies it"
    heapify(arr) {
        this.array = arr;
        this.size = arr.length;
        var i;
        for (i = (this.size >> 1); i >= 0; i--) {
            this._percolateDown(i);
        }
    };
    
    // for internal use
    _percolateUp(i) {
        var myval = this.array[i];
        var p;
        var ap;
        while (i > 0) {
            p = (i - 1) >> 1;
            ap = this.array[p];
            if (!this.compare(myval, ap)) {
                break;
            }
            this.array[i] = ap;
            i = p;
        }
        this.array[i] = myval;
    };
    
    
    // for internal use
    _percolateDown(i) {
        var size = this.size;
        var hsize = this.size >>> 1;
        var ai = this.array[i];
        var l;
        var r;
        var bestc;
        while (i < hsize) {
            l = (i << 1) + 1;
            r = l + 1;
            bestc = this.array[l];
            if (r < size) {
                if (this.compare(this.array[r], bestc)) {
                    l = r;
                    bestc = this.array[r];
                }
            }
            if (!this.compare(bestc, ai)) {
                break;
            }
            this.array[i] = bestc;
            i = l;
        }
        this.array[i] = ai;
    };
    
    // Look at the top of the queue (a smallest element)
    // executes in constant time
    //
    // This function assumes that the priority queue is
    // not empty and the caller is resposible for the check.
    // You can use an expression such as
    // "isEmpty() ? undefined : peek()"
    // if you expect to be calling peek on an empty priority queue.
    //
    peek() {
        return this.array[0];
    };
    
    // remove the element on top of the heap (a smallest element)
    // runs in logarithmic time
    //
    //
    // This function assumes that the priority queue is
    // not empty, and the caller is responsible for the check.
    // You can use an expression such as
    // "isEmpty() ? undefined : poll()"
    // if you expect to be calling poll on an empty priority queue.
    //
    // For long-running and large priority queues, or priority queues
    // storing large objects, you may  want to call the trim function
    // at strategic times to recover allocated memory.
    poll() {
        var ans = this.array[0];
        if (this.size > 1) {
            this.array[0] = this.array[--this.size];
            this._percolateDown(0 | 0);
        } else {
            this.size -= 1;
        }
        return ans;
    };
    
    
    // recover unused memory (for long-running priority queues)
    trim() {
        this.array = this.array.slice(0, this.size);
    };
    
    // Check whether the heap is empty
    isEmpty() {
        return this.size === 0;
    };
}

// just for illustration purposes
var test_fpq = function () {
    // main code
    var x = new FastPriorityQueue(function (a, b) {
        return a < b;
    });
    x.add(1);
    x.add(0);
    x.add(5);
    x.add(4);
    x.add(3);
    while (!x.isEmpty()) {
        console.log(x.poll());
    }
};

if (require.main === module) {
    test_fpq();
}

module.exports.FPQ = FastPriorityQueue;

