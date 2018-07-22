//var Promise = require('promise');
console.log("Starting tests")
require('json')
var system_boot = require('./default/OS.js')

/// This is the example foe OS thread
/// We do thread testing for this
var test_worker = function *(name, time)
{
  var info = yield* OS.this_thread()
  console.log(name + " has started")
  
  yield* OS.break("Stop at step 1")
  console.log(name + " is doing step2")
  yield* OS.break("Stop at step 2")
  console.log(name + " is doing step3")
  yield* OS.break("Stop at step 3")
  console.log(name + " is going to sleep for " + time + " ticks")
  yield* OS.sleep(time)
  console.log(name + " has woken up")
  return "Complete"
}

function* test_OS()
{
  console.log("Starting thread test")
  var pid1 = yield* OS.create_thread(test_worker("worker1", 2), "/worker1")
  var pid2 = yield* OS.create_thread(test_worker("worker2", 4), "/worker2")
  
  yield* OS.wait({pid: pid1}, {pid: pid2})
  console.log("Thread test is complete")
}

//var ROOM = import("default/utils.room.js")
//console.log("Imported the stuff")
console.log("Done")

// Initializing system placeholders
global.Game = {}
global.Game.time = 0
global.Game.cpu = 
{
	limit:10,
	getUsed:function()
	{
		return 0
	}
}

global.Memory = 
{
	settings: {os_log_html: false}
}
global.Source = {}
global.StructureContainer = {}

function main(max_iterations)
{
	var tester = test_OS();
	for (var iter = 0; iter < max_iterations; iter++)
	{
		Game.time = iter;
		if (!system_boot(tester))
		{
			console.log("OS has completed all the threads. It is done")
			break;
		}
	}
}

main(100)

// Indexed Binary Heap with min search
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

function check_heap(heap)
{
	var result = []
	var indexes = new Array(heap.size())
	for (var i = 0; i < heap.size(); i++)
	{
		var cost = heap.costs[i]
		var obj = heap.objects[i]
		var index = obj?obj.index:null
		result.push([cost, index])
	}
	return result;
}

function testHeap(type)
{
	var heap = new type();
	
	// Source data for the heap
	var data = [134, 23, 43, 9, 5, 2, 6, 4, 3, 5, 13, 54, 24]
	
	for(var d in data)
	{
		var value = data[d]
		var obj = {src: d, index:0}
		var index = heap.push(value, obj)
	}
	
	var results = []
	
	while(heap.size() > 0)
	{
		console.log("Internal heap: " + JSON.stringify(check_heap(heap)))
		//console.log("Best=" + best.cost + " obj=" + JSON.stringify(best.obj))
		results.push(heap.best())
		heap.pop()
	}
	
	console.log("Sorted: " + JSON.stringify(results))
}

console.log("Testing MinHeap")
testHeap(IndexedMinHeap)

console.log("Testing MaxHeap")
testHeap(IndexedMaxHeap)

// Reference terrain from the room W8N3
var terrain=[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1,1,1,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1,1,1,0,0,1,1,1,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1]

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

function fixWidth(num, len)
{
	return num.toString().padStart(2)
}

function printGrid(costmap, width, height = -1, pad=2)
{
	if (height == -1)
		height = width
	//var costmap = readCosts(grid)
	var delim = '|'
	for (var y = 0; y < height; y++)
	{
		var line = "|"
		for(var x = 0; x < width; x++)
		{
			var index = x + y*width;
			var val = costmap[index]
			if (!val)
				val = ''
			line += fixWidth(val,pad) + delim
		}
		
		console.log(line)
	}
}

function testWave()
{
	var tsize = 50*50;
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
	
	// Source terrain
	console.log("Source terrain")
	printGrid(terrain, 50, 50)
	// Generated costs
	console.log("Terrain costs")
	printGrid(costmap, 50, 50)
	var mines = [[34, 20], [30, 21]]
	var control = [23, 42]
	
	var waveM0 = new Wave(costmap, 50)
	waveM0.addWave(...mines[0], 'm', 0)
	var waveM1 = new Wave(costmap, 50)
	waveM1.addWave(...mines[1], 'm', 0)
	var waveC = new Wave(costmap, 50)
	waveC.addWave(23, 42, 'c', 0)
	
	//printGrid(waveM0.readCosts(' '), 50)
	/*
	for(var i = 0; i < 2; i++)
	{
		waveM0.runWave(1000)
		console.log("Current wave iter=" + i + " integrity="+JSON.stringify(waveM0.checkIntegrity()))
		printGrid(waveM0.readCosts(' '), 50)
	}*/
	
	waveM0.runWave()
	waveM1.runWave()
	waveC.runWave()
	
	var result = new Array(tsize)
	for( var i = 0; i < tsize; i++)
	{
		if (!waveM0.nodes[i] || !waveM1.nodes[i] || !waveC.nodes[i])
			continue;
		result[i] = _.max([waveM0.nodes[i].cost, waveM1.nodes[i].cost, waveC.nodes[i].cost])
	}
	
	for (var i in mines)
	{
		var index = mines[i][0] + mines[i][1]*50
		result[index] = 'm'
	}
	
	result[control[0] + control[1]*50] = 'c'
	
	console.log("Resut costs")
	printGrid(result, 50, 50)
}

testWave()
/*
Promise.onPossiblyUnhandledRejection(function(error){
    throw error;
});*/

