/*
 * This function congains numerous grid utilities
 * It will register following classes to the globals:
 *  - IndexedMinHeap
 *  - IndexedMaxHeap
 *  - Wave
 *  - Grid
 */

// Indexed Binary Heap with minimum search
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


//Indexed Binary Heap
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
            adjacent.push([x0 + y0 * width, x0, y0]);
        }
    }
    return adjacent
}


//Generic 2d grid
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
}


class Wave
{
	constructor(terrain, size)
	{
		this.terrain = terrain
		this.size = size
		this.heap = new IndexedMinHeap()
		// Storage for wave nodes
		this.nodes = new Array(size*size)
		this.search_id = 0
	}
	
	reset()
	{
		this.search_id++
		this.heap = new IndexedMinHeap()
	}
	
	addWave(x, y, color, cost)
    {
        if (x < 0 || y < 0 || x >= this.size || y >= this.size)
        	throw new Error("Wave::addWave(" + x + "," + y + ") - coordinates are out ouf bounds size=" + this.size)
        
        var index = x + y*this.size
        console.log("Added new color="+color+" to multiwave wave at " + [x,y])
        
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
    // Simplistic wave propagation. No queue.
    //@returns number of nodes processed
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
        var adjacent = getAdjacent(current.x, current.y, this.size)
        
        //console.log("Heap contains " + this.heap.size() + " nodes" + " best at x=" + current.x + " y=" + current.y + " adj=" + adjacent + " len=" + adjacent.length)
        
        for(var j in adjacent)
        {
        	var adj = adjacent[j]
            var index = adj[0]
        	var x = adj[1]
        	var y = adj[2]
        	
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
                    adjNode.cost = newCost;
                    adjNode.from = current
                    adjNode.color = current.color
                    if (adjNode.x != adj[1] || adjNode.y != adj[2])
                    	throw new Error("Wave found node with broken coords, at " + adj[1] + "," + adj[2])
                    // TODO: Can update position in the heap in more conservative way
                    // But I need to implement two additional functions, for increased and for decreased costs
                    if (!(adjNode.index == null))
                    	this.heap.pop(adjNode.index)
                    console.log("Revisited node x=" + x + " y="+y + " cost=" + cost)
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
    
    runWave(maxIterations=10000)
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
    	}while(iteration < maxIterations);
    	console.log("Wave was interrupted after iter="+iteration + " visited=" + total)
    	return 0
    }
    
    // Get final cost
    // Returns a map {color->node}
    getNode(x, y)
    {
    	if (x < 0 || y < 0 || x >= this.size || y >= this.size)
        	throw new Error("Wave::getNode(" + x + "," + y + ") - coordinates are out ouf bounds size=" + this.size)
        return this.nodes[x + y*this.size]
    }
    
    readCosts(_default=0)
    {
    	var tsize = this.size*this.size;
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
    
    checkIntegrity()
    {
    	var empty = 0
    	var correct = 0
    	var invalid = 0
    	var size = this.size
    	for (var y = 0; y < size; y++)
		{
    		for (var x = 0; x < size; x++)
			{
    			var index = x + y*size;
    			var node = this.nodes[index]
    			if (node)
    			{
    				if (node.x == x && node.y == y)
    					correct++
    				else
    					invalid++
    			}
    			else
    			{
    				empty++;
    			}
			}
		}
    	return {empty:empty, correct:correct, invalid:invalid}
    }
}

global.Wave = Wave
global.IndexedMinHeap = IndexedMinHeap
global.IndexedMaxHeap = IndexedMaxHeap
global.Grid = Grid

module.exports = 
{
};