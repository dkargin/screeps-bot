//var Promise = require('promise');
console.log("Starting tests")

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

/*
Promise.onPossiblyUnhandledRejection(function(error){
    throw error;
});*/

