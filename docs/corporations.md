# Corporations #

Corporations are representing a group of creeps and structures, that do some task in a isolated way, without help with 'external' creeps. This approach should reduce control complexity and reach maximum performance for specific economy role

Every corporation has some sort of property. Corporation calculates maintenance costs for this property.

Also each corporation class provides a set of AI actions, like 'build_miner'. This action describes an effect to the economy, like increasing resource flow or upgrade rate. This actions are used in economy planner.

## Economy overview ##

Possible income sources:

1. Room mines
2. External mines
3. External keeper mines
4. External salvaging

Where we spend it
1. Feeding spawns. Renewing creeps as well.
2. Feeding the controller and RCL. Can eat any amount of energy.
3. Spending on internal buildings, like extensions, containers and roads.
4. Building and sustaining the walls.
5. Army.

## MiningCorpLocal ##

Corporation should deal with local energy mining in a room

Goal: deals with mining process
Name: Mining@${roomName}

Property:
	- energy source
	- chest near energy source
	- mining spot near energy source. We need only one spot
	- 'drill' miner. It works until it gets very old
	- number of servitors. Do we need it, or should we use logistics network

Actions:
	- Add miner. Generates income. Increases maintenance
	- Add container near mine
	- Add a road. Increases maintenance. Increases resource flow from movers



## UpgradeCorp ##

Goal: deals with upgrading process of room controller
Name: Upgrade@roomName
Property: 
 - contaier near to controller
 - upgrade spots around storage
 - several 'upgrader' creeps
 - several 'upgrader' spots, that are occupied by upgrader creeps
 - road from logistics center (storage or container
 - mover creep, if it can be occupied 100%
 - logistics source. This source can be moved to another place. Corporation should adapt to this change

Starts at t2 with build access to a storage

UpgradeCorp request additional supplies every N ticks (i.e 10 ticks), with amount, equal to corporation energy consumption for this N ticks
Some sort of room distribution manager decides which portion of room total income can be sent to UpgradeCorp, and confirms 'giveme' request with altered energy amount

Actions for solver:
 - add new upgrader. Increases upgrade rate. Increases expenses
 - build a storage. Reduce expenses. Howmuch? (less movers). 
 - build a road. Increase road expenses, reduce mover expenses (faster transport rate) 

Calculates proper spots for upgraders and keeps upgraders at this spots. Controls energy delivery and distribution between working upgraders. Controls upgrader energy consumption up to room estimated production 

Maths
Mine provides max=10energy per spot
Foreign mine provides max = 5 energy per spot
T1(300) upgrades 2 per tick , workParts = 2
T2(550) upgrades 4 per tick , workParts = 4 -> 5 upgraders per room, 
T3(800) upgrades 5 per tick, workParts = 5 -> 4 upgraders, 2 per foreign room
T4(1300) upgrades 10 per tick, workParts = 10 -> 2 upgraders per room, 1 upgrader per foreign room

Need to allocate up to 8 upgrade spots around container near upgrading spot. One free spot is reserved for delivery creeps

upgradersRequired = room.getIncomeToUpgraders() / workParts
  
On start:
1. Calculate upgrading spots


## SpawnCorp ##

Name = "Spawn@roomName"

Property: 
 - all the spawns in a room
 - container near every spawn. It works as 'suicide spot'
 - single mover of a largest size
 - all the extensions
 - road around all the extensions
 
Starts at t2 with the first extension group. Rents a worker at t3 to completely control extention filling

All creeps with 'Refresh' job gather here and visit spawn in a strict order to prevent crowding. Maybe it is better to be of SpawnCorp

## Scouting ##

Starts at t2 and using scouts to get room information
Will fire all the scouts when observer is available, except for harrasment tasks

Does scouting stuff. Visits adjacent rooms with no creeps and info available. 
Does harassing and checks whether adjacent room has activated safemode when scout has entered

Information collected:
1. Landscape:
	- hard landscape (wall, swamp, ...)
	- built structures
2. Mine information: get mine positions
3. Player-room information:
	safe_mode_ticks_left
	safe_activations_left
	instant_save - whether player activates safe mode if any enemy creep arrives
	tower positions
4. Player economy. We can gather the same information about our rooms, it is quite usefull
	estimated_reserves - check every container and estimate current reserve
	estimated_upgrade_speed - check room controller upgrade status
	estimated_mine_speed - check how fast resources are mined
	estimated_tech - get current spawn tech

### Harrassment ###

Turret deals 600 damage at point blank range and 150 at max range. Scout needs to survive two-three hits. Also should move at maximum speed
Harasser should have body like {ranged:1, melee:1, tough: 1, move:3}

