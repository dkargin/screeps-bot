// Contains test for binary heaps

require('@internal/default/utils.grid')

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

function testHeap(type, data, sorted)
{
	var heap = new type();
		
	for(var d in data)
	{
		var value = data[d]
		var obj = {src: d, index:0}
		var index = heap.push(value, obj)
	}
	
	var results = []
	
	while(heap.size() > 0)
	{
		//console.log("Internal heap: " + JSON.stringify(check_heap(heap)))
		//console.log("Best=" + best.cost + " obj=" + JSON.stringify(best.obj))
		results.push(heap.best())
		heap.pop()
	}
	
	console.log("Sorted: " + JSON.stringify(results))
	// TODO: compare with sorted array & assert
}

module.exports = function()
{
	// Source data for the heap
	var data = [134, 23, 43, 9, 5, 2, 6, 4, 3, 5, 13, 54, 24]
	var sorted_max = [134,54,43,24,23,13,9,6,5,5,4,3,2]
	var sorted_min = [2,3,4,5,5,6,9,13,23,24,43,54,134]

	console.log("Testing MinHeap")
	testHeap(IndexedMinHeap, data, sorted_min)	
	console.log("Testing MaxHeap")
	testHeap(IndexedMaxHeap, data, sorted_max)
}