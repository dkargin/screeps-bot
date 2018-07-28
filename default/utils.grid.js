/**
 * This function congains numerous grid utilities
 * It will register following classes to the globals:
 *  IndexedMinHeap
 *  IndexedMaxHeap
 *  Wave
 *  Grid
 * 
 * Following functions are exported to global:
 *  coords2str(x,y)
 *  str2coords(packed)
 *  flat_distance(a, b) -> {Number}
 *  is_near(a, b) -> {Bool}
 *  getAdjacent(x,y) -> [[x0, y0], [x1, y1, ...]
 *  minCellInGrid(costs, width, height) -> [best, [x, y]]
 *  terrainToCostmap(terrain, width, height)
 */

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

/**
 * Check if room position 'a' is near to room position 'b'
 * @returns {Bool}
 */
global.isNear = function(a,b)
{
	if (a.roomName === b.roomName)
	{
		var dx = Math.abs(a.x - b.x)
		var dy = Math.abs(a.y - b.y)
		return Math.max(dx, dy) <= 1
	}
	return false
}

/**
 * Marks area around specified point using callback
 * @callback should return spot type
 */ 
global.mark_area_1 = function(x0, y0, callback)
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
 * Finds the coordinate with the munimal cost in the entire grid
 * @param costs {Array} - flat array with costs
 * @param width - width of the flat array
 * @param height - height of the flat array
 * @returns {Array} - an array with [bestCost, [x, y]]
 */
function minCellInGrid(costs, width, height)
{
	if (!Array.isArray(costs))
		throw new Error("Should provide an array")	
	if (!Number.isInteger(width) || !Number.isInteger(height))
    	throw new Error("Invalid size")
	if (costs.length != (width*height))
		throw new Error("Invalid costmap size")
	
	var best
	var bestCost = 200
	for(var y = 0; y < height; y++)
	{
		for(var x = 0; x < width; x++)
		{
			var index = x + y*width
			var cost = costs[index]
			if (!cost || cost < 0)
				continue
			if (cost < bestCost)
			{
				best = [x, y]
				bestCost = cost
			}
		}
	}
	return [bestCost, best]
}

function getAdjacent(x, y, width, height)
{
    var adjacent = []
    for(var y0 = y-1; y0 <= y+1; y0++ )
    {
    	if (y0 < 0 || y0 >= height)
            continue
        for(var x0 = x-1; x0 <= x+1; x0++ )
        {
            if (x0 < 0 || x0 >= width)
                continue;
            if (x0 == x && y0 == y)
                continue
            adjacent.push([x0 + y0 * width, x0, y0]);
        }
    }
    return adjacent
}

/**
 * Indexed Binary Heap
 * Elements are sorted in ascending order 
 */
class IndexedMinHeap
{
	constructor()
	{
		// Object storage
		this.objects = []
		// Cost storage
		this.costs = []
		// Number of elements
		this.heap_size = 0
	}
	
	// Pushes object onto a heap
	// @returns index of this object
	push(cost, object)
	{
	    // First insert the new key at the end
	    this.heap_size++;
	    var i = this.heap_size - 1;
	    var costs = this.costs
	    var objects = this.objects
	    if (this.heap_size > this.costs.length)
	    {
	    	costs.push(cost)
	    	objects.push(object)
	    }
	    else
    	{
	    	costs[i] = cost
	    	objects[i] = object
    	}
	    
	    object.index = i
	    var tmp
	    // Fix the min heap property if it is violated
	    while (i != 0)
	    {
	    	var p = (i>>1)
	    	if (costs[p] < costs[i])
	    		break;
	    	tmp = costs[i]; costs[i] = costs[p]; costs[p] = tmp
	    	tmp = objects[i]; objects[i] = objects[p]; objects[p] = tmp
	    	objects[i].index = i
	    	i = p;
	    }
	    objects[i].index = i
	    return i
	}
	
	minChild(i)
	{
		var r = (i<<1) + 2
		var l = (i<<1) + 1 
	    if (r >= this.heap_size)
	        return l
	    else if (this.costs[l] < this.costs[r])
            return l
        else
            return r
	}
	
	_percDown(i)
	{
		var costs = this.costs
		var objects = this.objects
		var tmp
	    while((i<<1)+1 < this.heap_size)
	    {
	        var mc = this.minChild(i)
	        
	        if (i == mc)
	        	throw new Error("Heap is broken i="+i+" mc="+mc)
	        
	        //console.log("Iterating heap i="+i+" mc="+mc + " cost="+costs[mc])
	        if(costs[mc] < costs[i])
	        {
	            tmp = costs[i]; costs[i] = costs[mc]; costs[mc] = tmp
	            tmp = objects[i]; objects[i] = objects[mc]; objects[mc] = tmp
	            objects[mc].index = mc
	            objects[i].index = i
	        }
	        i = mc
	    }
	}
	
	// Returns best cost
	best()
	{
		if (this.heap_size == 0)
			return
		return this.costs[0]
	}
	
	// Return best object
	// @returns stored object
	pop()
	{
		if (this.heap_size == 0)
			return
			
	    var cost = this.costs[0]
		var obj = this.objects[0]
		obj.index = null
		
		// Swap with the last object
	    var last = this.heap_size-1
	    if (last > 0)
	    {
		    this.costs[0] = this.costs[last];
		    this.objects[0] = this.objects[last];
		    this.objects[0].index = 0;
		    //console.log("Switched with cost=" + this.costs[0])
	    }
	    
	    this.costs[last] = null;
	    this.objects[last] = null;
	    this.heap_size = last
	    this._percDown(0)
	    
	    return obj
	}
	
	// Returns current size of a heap
	size()
	{
		return this.heap_size;
	}
}


/**
 * Indexed Binary Heap
 * Elements are sorted in descending order 
 */
class IndexedMaxHeap
{
	constructor()
	{
		// Object storage
		this.objects = []
		// Cost storage
		this.costs = []
		// Number of elements
		this.heap_size = 0
	}
	
	// Pushes object onto a heap
	// @returns index of this object
	push(cost, object)
	{
	    // First insert the new key at the end
	    this.heap_size++;
	    var i = this.heap_size - 1;
	    var costs = this.costs
	    var objects = this.objects
	    if (this.heap_size > this.costs.length)
	    {
	    	costs.push(cost)
	    	objects.push(object)
	    }
	    else
    	{
	    	costs[i] = cost
	    	objects[i] = object
    	}
	    
	    object.index = i
	    var tmp
	    // Fix the min heap property if it is violated
	    while (i != 0)
	    {
	    	var p = (i>>1)
	    	if (costs[p] > costs[i])
	    		break;
	    	tmp = costs[i]; costs[i] = costs[p]; costs[p] = tmp
	    	tmp = objects[i]; objects[i] = objects[p]; objects[p] = tmp
	    	objects[i].index = i
	    	i = p;
	    }
	    objects[i].index = i
	    return i
	}
	
	minChild(i)
	{
		var r = (i<<1) + 2
		var l = (i<<1) + 1 
	    if (r >= this.heap_size)
	        return l
	    else if (this.costs[r] > this.costs[l])
            return r
        else
            return l
	}
	
	_percDown(i)
	{
		var costs = this.costs
		var objects = this.objects
		var tmp
	    while((i<<1)+2 < this.heap_size)
	    {
	        var mc = this.minChild(i)
	        
	        if (i == mc)
	        	throw new Error("Heap is broken i="+i+" mc="+mc)
	        
	        //console.log("Iterating heap i="+i+" mc="+mc + " cost="+costs[mc])
	        if(costs[mc] > costs[i])
	        {
	            tmp = costs[i]; costs[i] = costs[mc]; costs[mc] = tmp
	            tmp = objects[i]; objects[i] = objects[mc]; objects[mc] = tmp
	            objects[mc].index = mc
	            objects[i].index = i
	        }
	        i = mc
	    }
	}
	
	// Returns best cost
	best()
	{
		if (this.heap_size == 0)
			return
		return this.costs[0]
	}
	
	// Return best object
	// @returns stored object
	pop(index=0)
	{
		if (this.heap_size == 0)
			return
			
	    var cost = this.costs[index]
		var obj = this.objects[index]
		obj.index = null
		
		// Swap with the last object
	    var last = this.heap_size-1
	    if (last > 0)
	    {
		    this.costs[index] = this.costs[last];
		    this.objects[index] = this.objects[last];
		    this.objects[index].index = index
		    //console.log("Switched with cost=" + this.costs[0])
	    }
	    
	    this.costs[last] = null;
	    this.objects[last] = null;
	    this.heap_size = last
	    this._percDown(index)
	    
	    return obj
	}
	
	// Returns current size of a heap
	size()
	{
		return this.heap_size;
	}
}

/**
 * Generic 2d grid
 */
class Grid
{
	constructor(width, height, initial=null)
	{
	    this.width = width
	    this.height = height
	    this.data = new Array(width*height)
	    for (var i = 0; i < width*height; i++)
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
	// @returns {String} serialized string
	serialize()
	{
		var output = ""
		var width = this.width
		var height = this.height
		for(var y = 0; y < height; y++)
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
	
	/**
	 * Calculate effective cost of the path
	 * 	This function treats each cell as terrain type
	 * @param path {Array} - a path to be calculated
	 * @returns {Number} total cost
	 */
	effectiveTerrainPathCost(path)
	{
		var distance = 0
		for(var i = 0; i < path.length; i++)
		{
			var terrain = this.get(path[i].x, path[i].y)
			distance += (terrain == TERRAIN_SWAMP ? 5 : 1)	
		}
		return distance
	}

	/**
	 * Calculate effective cost of the path
	 * This function treats each cell as traverse cost
	 * @param path {Array} - a path to be calculated
	 * @returns {Number} total cost. Can return negative value if path is invalid
	 */
	effectivePathCost(path)
	{
		var distance = 0
		for(var i = 0; i < path.length; i++)
		{
			var terrain = this.get(path[i].x, path[i].y)
			if (terrain == null || terrain < 0)
				return -1
			distance += terrain	
		}
		return distance
	}
}

/**
 * Wave algorithm
 * Used to find shortest paths or running distance transform
 */
class Wave
{
	constructor(terrain, width, height)
	{
		if (!Number.isInteger(width) || !Number.isInteger(height))
        	throw new Error("Invalid wave size")
		this.terrain = terrain
		this.width = width
		this.height = height
		this.heap = new IndexedMinHeap()
		// Storage for wave nodes
		this.nodes = new Array(width*height)
		this.search_id = 0
	}
	
	reset()
	{
		this.search_id++
		this.heap = new IndexedMinHeap()
	}
	
	// Add new wave start
	addStart(x, y, cost=0, color=null)
    {
		if (!Number.isInteger(x) || !Number.isInteger(y))
        	throw new Error("Invalid coordinates: " + [x, y])
		
        if (x < 0 || y < 0 || x >= this.width || y >= this.height)
        	throw new Error("Wave::addWave("+[x, y]+") - coordinates are out ouf bounds size=" + [this.width, this.height])
        
        if (!_.isFinite(cost))
        	throw new Error("Wave::addWave("+[x, y]+") - cost should be a number: " + cost)
        var index = x + y*this.width
        //console.log("Added new color="+color+" to multiwave wave at " + [x,y])
        
        if (!this.nodes[index])
        	this.nodes[index] = {}
        
        var node = this.nodes[index]
        node.x = x
        node.y = y
        node.color = color
        node.cost = cost
        node.id = this.search_id
        // TODO: Node can be already inside this heap
        this.heap.push(cost, node)
    }
	
	// Check if we have reached the goal
    isDone(node)
    {
    	return false
    }
    
    // Runs a single step of the wave propagation.
    // @param stat - dictionary to store the statistics
    // @returns current size of the heap
    runOnce(stat={})
    {
    	if (this.heap.size() == 0)
    		return 0;
    	
        var terrain = this.terrain
        var processed_total = 0
        var invalid_cost = 0
        var skipped_alternative = 0
        
        var current = this.heap.pop()
        
        if (this.isDone(current))
        	return -1;
        
        // Contains direct indexes in a grid array
        var adjacent = getAdjacent(current.x, current.y, this.width, this.height)
        
        //console.log("Heap contains " + this.heap.size() + " nodes" + " best=" + [current.x, current.y, current.cost]  + " alen=" + adjacent.length)
        
        for(var j in adjacent)
        {
        	var adj = adjacent[j]
            var index = adj[0]
        	var x = adj[1]
        	var y = adj[2]
        	
        	if (x < 0 || y < 0 || x >= this.width || y >= this.height)
            	throw new Error("Wave::runOnce() from " + [current.x, current.y] + " to " +[x, y]+" - coordinates are out ouf bounds size=" + [this.width, this.height])
        	
            var cost = terrain[index]
            if (cost < 0)
            {
            	//console.log("Skipping unreachable cell " + [x, y])
            	invalid_cost++;
                continue;
            }
        	
        	var newCost = cost + current.cost;
            var adjNode = this.nodes[index]
            
            if (adjNode && adjNode.id == this.search_id) 
            {
            	// In fact, we can get here only if we have heuristics, or lifelong wave
        		if (newCost < adjNode.cost)
                {
        			throw new Error("Broken wave: revisited a node " + JSON.stringify(adjNode))
                    adjNode.cost = newCost;
                    adjNode.from = current
                    adjNode.color = current.color
                    if (adjNode.x != adj[1] || adjNode.y != adj[2])
                    	throw new Error("Wave found node with broken coords, at " + adj[1] + "," + adj[2])
                    // TODO: Can update position in the heap in more conservative way
                    // But I need to implement two additional functions, for increased and for decreased costs
                    if (!(adjNode.index == null))
                    	this.heap.pop(adjNode.index)
                    console.log("Revisited node " + [x,y] +" cost=" + cost)
                    this.heap.push(cost, adjNode)
                    processed_total++
                }
        		else
        		{
        			skipped_alternative++
        		}
            }
            else
            {
                //console.log("Creating node from ["+x+","+y+"] to adj="+adj + " cost="+newcost)
                var adjNode = 
                {
	                x:adj[1], y:adj[2],
			        color:current.color,
			        cost:newCost,
			        id:this.search_id
                }
                this.nodes[index] = adjNode
                this.heap.push(newCost, adjNode)
                processed_total++
                //console.log("Visited new node x=" + x + " y="+y + " cost=" + adjNode.cost + " index="+index)
            }    
        }
        
        stat.total = processed_total
        stat.unreachable = invalid_cost
        return this.heap.size()
    }
    
    runWave(maxIterations=-1)
    {
    	var total = 0;
    	var iteration = 0;
    	do
    	{
    		var stat = {}
    		var result = this.runOnce(stat)
    		var propagated = stat.total
    		if (result == 0)
    		{
    			console.log("Wave has stopped, visited=" + total)
    			return 1;
    		}
    		if (propagated > 0)
    			total += propagated;
    		iteration++;
    		if (maxIterations > 0 && iteration < maxIterations)
    			break;
    	}while(this.heap.size() > 0);
    	console.log("Wave was interrupted after iter="+iteration + " visited=" + total)
    	return 0
    }
    
    // Get final cost
    // Returns a map {color->node}
    getNode(x, y)
    {
    	if (x < 0 || y < 0 || x >= this.width || y >= this.height)
        	throw new Error("Wave::getNode(" + [x,y] + ") - coordinates are out ouf bounds size=" + [this.width, this.height])
        return this.nodes[x + y*this.width]
    }
    
    /** 
     * Get a path from specified node to the start of the wave
     * @returns {Array} - [[x1, y1, cost1], [x2, y2, cost2], ...]
     */
    getPath(x, y)
    {
    	let maxIter = this.width * this.height
    	var result = []
    	var node = getNode(x, y)
    	while(node)
    	{
    		result.push([node.x, node.y, node.cost])
    		node = node.prev
    	}
    	return result
    }
    
    readCosts(_default=0)
    {
    	var tsize = this.width*this.height;
    	var result = new Array(tsize);
    	var nodes = this.nodes
    	for(var i = 0; i < tsize; i++)
    	{
    		var node = nodes[i]
    		if (node)
    			result[i] = node.cost
    		else
    			result[i] = _default
    	}
    	return result
    }
    
    /**
     * Checks for wave integrity
     * It does the following checks:
     * 	- nodes have proper x,y coordinates
     *  - heap contains proper nodes. All nodes should be in the grid as well 
     */
    checkIntegrity()
    {
    	var empty = 0
    	var correctCoord = 0
    	var invalidCoord = 0
    	
    	var width = this.width
    	var height = this.height
    	
    	for (var y = 0; y < height; y++)
		{
    		for (var x = 0; x < width; x++)
			{
    			var index = x + y*width;
    			var node = this.nodes[index]
    			if (node)
    			{
    				if (node.x == x && node.y == y)
    					correctCoord++
    				else
    					invalidCoord++
    			}
    			else
    			{
    				empty++;
    			}
			}
		}
    	
    	// Checking heap integridy
    	var invalidHeapNodes = 0
    	var hsize = this.heap.size()
    	for (var i = 0; i < hsize; i++)
    	{
    		var node = this.heap.objects[i]
    		if (!node)
    		{
    			invalidHeapNodes++;
    			console.log("Heap contains null node at " + i)
    			continue;
    		}
    		if (this.getNode(node.x, node.y) != node)
    		{
    			invalidHeapNodes++;
    			console.log("Heap contains invalid node " + [node.x, node.y] + " at " + i)
    		}
    	}
    	return {empty:empty, correct:correctCoord, invalid:invalidCoord, invalidHeap:invalidHeapNodes}
    }
}

/**
 * Converts terrain array to move cost array
 * @param terrain {Array} - linear array with terrain
 * @param width {Number} - width of the terrain
 * @param height {Number}- height of the terrain
 * @returns
 */
function terrainToCostmap(terrain, width, height)
{
	if (!Array.isArray(terrain))
		throw new Error("Should provide an array")
	if (terrain.length != width*height)
		throw new Error("Size of terrain does not equal to specified bounds")
	
	var tsize = width*height;
	var costmap = new Array(tsize)
	
	for(var i = 0; i < tsize; i++)
	{
		var tile = terrain[i]
		if (tile == 1)
			costmap[i] = -1
		else if(tile == 2)
			costmap[i] = 5;
		else
			costmap[i] = 1;
	}
	return costmap;
}

global.Wave = Wave
global.Grid = Grid
global.IndexedMinHeap = IndexedMinHeap
global.IndexedMaxHeap = IndexedMaxHeap
global.minCellInGrid = minCellInGrid
global.getAdjacent = getAdjacent
global.terrainToCostmap = terrainToCostmap

module.exports = 
{
};