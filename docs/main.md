# TODO #

1. MineCorp
	- set update cycle for a mine
	- spawn miner for a corp. Capture 
1. SpawnCorp
	- place chest stop near spawn
1. upgrader corp
	- gather upgrade poisitions to UpgradeCorp
	- distribute upgrade positions. 
		Corporation has N upgrade positions, its coordinates are stored in this.uspots array
		Creep is assigned to role, that defines its upgrade position. Creep goes to this position and never leaves it
	- request delivery to upgrader chest position. Delivery_action is either 'distribute_all', or 'place_container'

1. population management. Tier upgrades and creep renewal
	- gather all 'role' creeps to specific array. 
		If array is full and there is creep with tech level lower than current
			Next time this creep enters 'Free' state, it should dump its cargo and go to 'suicide spot'. Corporation should fire this creep and move its role to 'unemployed'
			Ask spawn to recycle this creep
1. delivery to specific room container
	- move spawn/extension/tower deliveries through delivery queries
1. cancel delivery
	- need ability to cancel a delivery
	- servitor should check whether delivery target is still available
1. accurate delivery. Creeps should deliver exact requested amount 
1. terrain awareness. We do need to generate costmap for each room
	- add walls and swamp flags
	- add mine spot flag. Creeps should evade this spots. Only miners are allowed
	- add upgrade-storage spots. Only upgraders are allowed to stand at this spots
	- railway spot? 
1. Calculate travel time for a creep and a path


# Info #

https://docs.screeps.com/api/#Constants

# Room statuses #

By economical use:
0. CAPITAL. Highest room level, no need for external feeding?
1. CITY. Full mining, high room level
2. TOWN. Can pull resources from adjacent remote mines
3. REMOTE_MINE. - remote mining installation.

# Data structure #


```JS
Corporation = 
{
	memory: {
		room: "W5N6", 	// Room name
		personnel: [],	// Array of personnel records. Each record is array of [id, role]. ID can be none
		property: {},	// Buildings owned by this corporation. Maps logical name to a building id 
	},
}

```

RoomInfo contains persistent room information

```JS
RoomInfo = {
	mines: { // obj_id - object identifier, sort of the hash
		obj_id_1: {
			type: 'E',		// Type of the resource	
			x: 10,
			y: 20, 
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
	// Version of mine layout. Why do we version it
	mine_version: 1,
	// Version of the stored terrain. Why do we save it?
	terrain_version: 1,
	// Major version of room persistent data. We rebuild this data if ROOM_DATA_VERSION is different 
	version: 1, 
}

Creep.memory = {
	state: "mining", // current logical state
	role: "simple.miner", // behavior name. Should correspond to a record in global.Behaviors map.
	corp: "Miner@45N54Y", // Name of owning company 
}