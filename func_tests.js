//var Promise = require('promise');
console.log("Starting tests")
require('json')
var http = require('http')
require('./default/utils.grid.js')
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

/*
var server = http.createServer(function (req, res) {
  var html = buildHtml(req);

  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Content-Length': html.length,
    'Expires': new Date().toUTCString()
  });
  res.end(html);
})

server.listen(4444)
*/
function buildHtml(req) {
  var header = '';
  var body = '';

  // concatenate header string
  // concatenate body string

  return '<!DOCTYPE html>'
       + '<html><head>' + header + '</head><body>' + body + '</body></html>';
};
// Reference terrain from the room W8N3
var terrain=[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1,1,1,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1,1,1,0,0,1,1,1,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1]

var costmap = terrainToCostmap(terrain, 50, 50)

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
		if (y == 0)
		{
			var header = fixWidth(y,pad)+'=|'
			for(var x = 0; x < width; x++)
				header += fixWidth(x,pad) + delim
			console.log(header)
		}
		
		var line = fixWidth(y,pad)+'=|'			
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

// States for room spots calculator
const ROOM_CALC_INIT = 0
const ROOM_CALC_PREPARE = 1
const ROOM_CALC_RUN_WAVES = 2
const ROOM_CALC_EXTRACT_COSTS = 3
const ROOM_CALC_FIND_CENTER = 4
const ROOM_CALC_DONE = 10

// Stateful spots calculator
class RoomSpotsCalculator
{
	constructor(costmap, spots, width=50, height=50)
	{
		this.costmap = costmap
		this.spots = spots
		this.width = width
		this.height = height
		this.waves = {}
		this.state = ROOM_CALC_INIT
	}
	
	_setState(state)
	{
		this.state = state
		return state
	}
	
	process*()
	{
		if (this.state != ROOM_CALC_INIT)
			throw("Room calculator is running already")
		yield this._setState(ROOM_CALC_PREPARE);
		
		this._stateInit()
		yield this._setState(ROOM_CALC_RUN_WAVE);
		
		// Run the waves
		// TODO: Check results for validity. Every wave should result with at least one checked neighbour
		for(var i in waves)
		{
			waves[i].runWave()
			yield this._setState(ROOM_CALC_RUN_WAVE);
		}
		
		waveE.runWave()
		yield this._setState(ROOM_CALC_RUN_WAVE);
		
		_harvestResults()
		yield this._setState(ROOM_CALC_DONE);
	}
	
	// Calculates exit points
	_stateInit()
	{
		var width = this.width
		var height = this.height
		var costmap = this.costmap
		// Total size for flat arrays
		var tsize = width*height;
		
		var exits =  {left:[], right:[], top:[], bottom:[]}
		this.exits = exits
		
		// 1. Calculate exit points. I am trying to conserve clockwise order
		for(var x = 0; x < width; x++)
		{
			if (costmap[x] == 0)
				exits.top.push([x, 0])
			if (costmap[width - x - 1 + (height-1)*width] == 0)
				exits.bottom.push([width - x - 1, height-1]);
		}
		
		for(var y = 0; y < height; y++)
		{
			if (costmap[(height-y-1)*width] == 0)
				exits.left.push([0, height-y-1])
			if (costmap[width-1 + y*width])
				exits.right.push([width-1, y])
		}
		
		// 2. Initialize the waves
		this.waves = {}
		var minesAdded = 0;
		if ('mines' in this.spots)
		{
			for(var i in this.spots.mines)
			{
				var mine = this.spots.mines[i]
				var wave = new Wave(costmap, width, height)
				wave.addStart(...mine)
				this.waves['mine'+i] = wave
				this.minesAdded++;
			}
		}
		
		if (this.minesAdded == 0)
			throw new Error("calculateRoomSpots() spots should contain some mines, or this room is pointless")
		
		if ('controller' in this.spots)
		{
			var waveC = new Wave(costmap, width, height)
			waveC.addStart(...this.spots.controller)
			this.waves.controller = waveC
		}else
			throw new Error("calculateRoomSpots() spots should contain a controller")
		
		// Adding exits
		var waveE
		var exitsAdded = 0;
		for(var side in exits)
		{
			for(var i in exits[side])
			{
				var exit = exits[side][i]
				if(!waveE)
				{
					waveE = new Wave(costmap, width, height)
				}
				waveE.addStart(...exit)
				exitsAdded++
			}
		}
	}
	
	_harvestResults()
	{
		// Costs for placing logistics center
		var logisticCosts = new Array(tsize)
		// Logistic costs + scaled distance from the exit. It is additional safety metric
		var totalCosts = new Array(tsize)
		var checkedCells = 0
		for( var i = 0; i < tsize; i++)
		{
			var valid = true
				
			var costs = []
			for(var w in waves)
			{
				var node = waves[w].nodes[i] 
				if (!node)
				{
					valid = false;
					break;
				}
				else
				{
					costs.push(node.cost)
				}
			}
			
			if (valid)
			{
				logisticCosts[i] = _.max(costs)
				if (waveE.nodes[i])
					totalCosts[i] = Math.round(logisticCosts[i] + (25-waveE.nodes[i].cost/4))
				checkedCells++
			}
			else
				continue;
		}
		if (checkedCells == 0)
			throw("calculateRoomSpots() checked zero spots for room center")
	}
}

Calculate necessary spots
// @param terrain - raw terrain
// @param spots - a table with {mines:[], controller=[x,y], spawn=[x,y]}
// @returns - a table with calculates spots
function calculateRoomSpots(costmap, spots, width=50, height=50)
{
	// Total size for flat arrays
	var tsize = width*height;
	
	var exits = {left:[], right:[], top:[], bottom:[]}
	// 1. Calculate exit points. I am trying to conserve clockwise order
	for(var x = 0; x < width; x++)
	{
		if (costmap[x] == 0)
			exits.top.push([x, 0])
		if (costmap[width - x - 1 + (height-1)*width] == 0)
			exits.bottom.push([width - x - 1, height-1]);
	}
	for(var y = 0; y < height; y++)
	{
		if (costmap[(height-y-1)*width] == 0)
			exits.left.push([0, height-y-1])
		if (costmap[width-1 + y*width])
			exits.right.push([width-1, y])
	}
	
	// 2. Initialize the waves
	var waves = {}
	var minesAdded = 0;
	if ('mines' in spots)
	{
		for(var i in spots.mines)
		{
			var mine = spots.mines[i]
			var wave = new Wave(costmap, width, height)
			wave.addStart(...mine)
			waves['mine'+i] = wave
			minesAdded++;
		}
	}
	
	if (minesAdded == 0)
		throw new Error("calculateRoomSpots() spots should contain some mines, or this room is pointless")
	
	if ('controller' in spots)
	{
		var waveC = new Wave(costmap, width, height)
		waveC.addStart(...spots.controller)
		waves.controller = waveC
	}else
		throw new Error("calculateRoomSpots() spots should contain a controller")
	
	// Adding exits
	var waveE
	var exitsAdded = 0;
	for(var side in exits)
	{
		for(var i in exits[side])
		{
			var exit = exits[side][i]
			if(!waveE)
			{
				waveE = new Wave(costmap, width, height)
			}
			waveE.addStart(...exit)
			exitsAdded++
		}
	}	
	
	// Run the waves
	// TODO: Check results for validity. Every wave should result with at least one checked neighbour
	for(var i in waves)
		waves[i].runWave()
		
	waveE.runWave()	
	// 3. Calculate the best center pose
	
	// Costs for placing logistics center
	var logisticCosts = new Array(tsize)
	// Logistic costs + scaled distance from the exit. It is additional safety metric
	var totalCosts = new Array(tsize)
	var checkedCells = 0
	for( var i = 0; i < tsize; i++)
	{
		var valid = true
			
		var costs = []
		for(var w in waves)
		{
			var node = waves[w].nodes[i] 
			if (!node)
			{
				valid = false;
				break;
			}
			else
			{
				costs.push(node.cost)
			}
		}
		
		if (valid)
		{
			logisticCosts[i] = _.max(costs)
			if (waveE.nodes[i])
				totalCosts[i] = Math.round(logisticCosts[i] + (25-waveE.nodes[i].cost/4))
			checkedCells++
		}
		else
			continue;
	}
	if (checkedCells == 0)
		throw("calculateRoomSpots() checked zero spots for room center")
	console.log("Logistic costs")
	printGrid(logisticCosts, width, height)
	console.log("Logistic costs - exit distance")
	printGrid(totalCosts, width, height)
	
	var best
	var bestCost = 200
	for(var y = 0; y < height; y++)
	{
		for(var x = 0; x < width; x++)
		{
			var index = x + y*width
			var cost = totalCosts[index]
			if (!cost)
				continue
			if (cost < bestCost)
			{
				best = [x, y]
				bestCost = cost
			}
		}
	}
}


// Test for a single wave, in case it seems broken.
// It iterates over the wave until it collapses.
// @param costmap - flat costmap array
// @param size - array with costmap size, [width, height]
// @param start - array with the coordinates of the start point, [x, y]
function testSingleWave(costmap, size, start)
{
	var tsize = size[0]*size[1];
	console.log("Terrain costs")
	printGrid(costmap, ...size)
	var wave = new Wave(costmap, ...size)
	wave.addStart(...start)
	for(var i = 0; i < 100000; i++)
	{
		var stat = {}
		if (!wave.runOnce(stat))
		{
			console.log("Wave was extinguished at i=" + i)
			break;
		}
		//printGrid(wave.readCosts(' '), size[0])
		var result = wave.checkIntegrity()
		console.log('Wave integrity=' + JSON.stringify(result))
	}
	
	printGrid(wave.readCosts(' '), size[0])
}

function testWave(costmap, width, height)
{
	var tsize = width*height;
	// Generated costs
	console.log("Terrain costs")
	printGrid(costmap, width, height)
	var mines = [[34, 20], [30, 21]]
	var control = [23, 42]
	
	var waveM0 = new Wave(costmap, width, height)
	waveM0.addStart(...mines[0], 0, 'm')
	var waveM1 = new Wave(costmap, width, height)
	waveM1.addStart(...mines[1], 0, 'm')
	var waveC = new Wave(costmap, width, height)
	waveC.addStart(...control, 0, 'c')
	
	/*
	for(var i = 0; i < 2; i++)
	{
		waveM0.runWave(1000)
		console.log("Current wave iter=" + i + " integrity="+JSON.stringify(waveM0.checkIntegrity()))
		printGrid(waveM0.readCosts(' '), width)
	}*/
	
	console.log("Running waveM0")
	waveM0.runWave()
	printGrid(waveM0.readCosts(' '), width)
	
	console.log("Running waveM1")
	waveM1.runWave()
	printGrid(waveM1.readCosts(' '), width)
	console.log("Running waveC")
	waveC.runWave()
	printGrid(waveC.readCosts(' '), width)
	
	console.log("Processing results")
	var result = new Array(tsize)
	for( var i = 0; i < tsize; i++)
	{
		if (!waveM0.nodes[i] || !waveM1.nodes[i] || !waveC.nodes[i])
			continue;
		result[i] = _.max([waveM0.nodes[i].cost, waveM1.nodes[i].cost, waveC.nodes[i].cost])
	}
	
	for (var i in mines)
	{
		var index = mines[i][0] + mines[i][1]*width
		result[index] = 'm'
	}
	
	result[control[0] + control[1]*width] = 'c'
	
	console.log("Resut costs")
	printGrid(result, width, height)
}

testWave(costmap, 50, 50)

//testSingleWave(costmap, [50, 50], [23, 42])

calculateRoomSpots(costmap, {mines:[[34, 20], [30, 21]], controller:[23, 42]})
/*
Promise.onPossiblyUnhandledRejection(function(error){
    throw error;
});*/

