# Corporations #

Corporations are representing a group of creeps and structures, that do some task in a isolated way, without help with 'external' creeps. This approach should reduce control complexity and reach maximum performance for specific economy role

## MiningCorp ##

Local corporations starts at t3 with access to optimal miner
Remote mining starts at t2

## UpgradeCorp ##

Starts at t2 with build access to a storage.

Calculates proper spots for upgraders and keeps upgraders at this spots. Controls energy delivery and distribution between working upgraders. Controls upgrader energy consumption up to room estimated production 

## SpawnCorp ##

Starts at t2 with the first extension group. Rents a worker at t3 to completely control extention filling

## Sanitarium ##

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

Turret deals 600 damage. Scout needs to survive two-three hits. Also should move at maximum speed
Harasser should have body like {ranged:1, melee:1, tough: 1, move:3}

http://screeps.wikia.com/wiki/Globals