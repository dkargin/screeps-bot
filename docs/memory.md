# Memory layouy #

https://docs.screeps.com/api/#Constants


```JS
Corporation = 
{
	memory: {
		room: "W5N6", 	// Room name
		personnel: {	// Array of personnel records. Each record is array of [id, role]. ID can be none
			"Miner@0": { 
				"work": [33, 21], 
				"id":"4322453242dsf",
				"creep": Object,
			},
			"Assistant@0": {
				"work": [33, 21], 
				"id":"4322453242dsf",
				"creep": Object,
			}
		},
		property: {},	// Buildings owned by this corporation. Maps logical name to a building id 
	},
}
```

RoomInfo contains persistent room information. This info is periodically dumped to the memory.

```JS
RoomInfo = {
	mines: { // obj_id - object identifier, sort of the hash
		obj_id_1: {
			type: 'E',		// Type of the resource	
			pos: [10, 20],	// Coordinates 
			path: [], 		// Path from the mine to the room center  
		},
	}, 
	controller: {
		level:4, // Last observed controller level
		x:30, :40,
		progress:ctrl.progress,
		// Total energy stored
		total:ctrl.progressTotal
	},
	center: {x:34, y:34},		// Room center
	// Flat array with terrain costs
	terrain: Array(50*50),
	// Building spots. To be refactored to a more proper array 
	spots: Array(50*50),
	economy:{},		
	lairs:{},			// Lair positions
	role: 1,
	// Version of mine layout. Why do we version it
	mine_version: 1,
	// Version of the stored terrain. Why do we save it?
	terrain_version: 1,
	// Major version of room persistent data. We rebuild this data if ROOM_DATA_VERSION is different 
	version: 1, 
}
```
Room statuses, by economical use:
0. CAPITAL. Highest room level, no need for external feeding?
1. CITY. Full mining, high room level
2. TOWN. Can pull resources from adjacent remote mines
3. REMOTE_MINE. - remote mining installation.

```
Creep.memory = {
	state: "mining", // current logical state
	role: "simple.miner", // behavior name. Should correspond to a record in global.Behaviors map,
	corp: "Miner@45N54Y", // Name of owning company 
}