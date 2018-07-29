//var Promise = require('promise');
console.log("Starting tests")
require('json')

var test_os = require('./test/test_os')
test_os()

var test_heap = require('./test/test_heap')
test_heap()

function testLogicCompilation()
{
	// Testing that all modules can be properly parsed
	//require('@internal/default')
	require('@internal/default/corp.mine')
	require('@internal/default/utils.room.js')
	require('@internal/default/corporation.js')
	require('@internal/default/simple.ai.js')
	require('@internal/default/spawner.js')
	return true
}

testLogicCompilation()

/*
var http = require('http')
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

function buildHtml(req) {
  var header = '';
  var body = '';

  // concatenate header string
  // concatenate body string

  return '<!DOCTYPE html>'
       + '<html><head>' + header + '</head><body>' + body + '</body></html>';
};
*/
// Reference terrain from the room W8N3
var terrain=[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1,1,1,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1,1,1,0,0,1,1,1,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,1,1,0,0,1,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1]

var costmap = terrainToCostmap(terrain, 50, 50)

// Pads string width
function fixWidth(num, len=2)
{
	return num.toString().padStart(len)
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

// Generate costmap from the waves
function harvestRoomWaveCostmap(width, height, waves, waveE)
{
	console.log("Harvesting wave results")
	var tsize = width * height
	// Costs for placing logistics center
	var logisticCosts = new Array(tsize)
	
	// Logistic costs + scaled distance from the exit. It is additional safety metric
	var totalCosts = new Array(tsize)
	this.totalCosts = totalCosts
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
		throw("harvestRoomWaveCostmap() checked zero spots for room center")
		
	return [logisticCosts, totalCosts]
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
	
	*process()
	{
		if (this.state != ROOM_CALC_INIT)
			throw("Room calculator is running already")
		yield this._setState(ROOM_CALC_PREPARE);
		
		this._stateInit()
		
		var waves = this.waves
		// Run the waves
		// TODO: Check results for validity. Every wave should result with at least one checked neighbour
		for(var i in waves)
		{
			yield this._setState(ROOM_CALC_RUN_WAVES);
			console.log("Running wave #"+i)
			waves[i].runWave()
		}
		
		yield this._setState(ROOM_CALC_RUN_WAVES);
		if (this.waveE)
		{
			console.log("Running wave E")
			this.waveE.runWave()
		}
		
		yield this._setState(ROOM_CALC_EXTRACT_COSTS);
		var [logisticCosts, totalCosts] = harvestRoomWaveCostmap(this.width, this.height, this.waves, this.waveE)
		this.logisticCosts = logisticCosts
		this.totalCosts = totalCosts
		
		// Calculating room center
		var [bestCost, bestCoord] = minCellInGrid(totalCosts, this.width, this.height)
		console.log("Best spot = " + bestCoord + " cost=" + bestCost)
	}
	
	getResult()
	{
		return {}
	}
	
	/**
	 * Initializes the waves
	 */
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
		var exitsAdded = 0;
		for(var side in exits)
		{
			for(var i in exits[side])
			{
				var exit = exits[side][i]
				if(!this.waveE)
				{
					this.waveE = new Wave(costmap, width, height)
				}
				this.waveE.addStart(...exit)
				exitsAdded++
			}
		}
	}
}

/**
 * Calculate necessary spots
 * @param terrain - raw terrain
 * @param spots - a table with {mines:[], controller=[x,y], spawn=[x,y]}
 * @returns - a table with calculates spots
 */
function calculateRoomSpots(costmap, spots, width=50, height=50)
{
	var calculator = new RoomSpotsCalculator(costmap, spots, width, height);
	
	var process = calculator.process()
	
	var result
	do
	{
		result = process.next();
		if (result)
			console.log("Calculator has reached state="+result.value)
	}while(result && !result.done)
	
	var result = calculator.getResult();
	console.log("Calculated layout: " + JSON.stringify(result))	
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

//testSingleWave(costmap, [50, 50], [23, 42])

calculateRoomSpots(costmap, {mines:[[34, 20], [30, 21]], controller:[23, 42]})
