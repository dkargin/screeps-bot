# JavaScript AI for screeps game #

Another screeps AI

This AI uses "operation system"-like approach to manage thread objects. Threads and interactions with OS are implemented using coroutines and yield.

General status:

 - OS - mostly OK. Waiting for threads or events can be more CPU-conservative.
 - AI - broken and being reworked

# Project structure #

`default` - contains actual AI code
`docs` - some documentation to read
`test` - generic standalone tests
	- `mock_game.js` - provides mock game classes
	- `test_heap.js` - tests for binary heaps
	- `test_os.js` - tests for OS
	 

`func_tests.js` main script for standalone testing. I do develop a lot of code separately from screeps game.

Usage: `node func_tests.js`
