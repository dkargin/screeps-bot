
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

http://screeps.wikia.com/wiki/Globals

first_tick = true
main = function()
{
	if(first_tick)
	{
		OS.add_task(init_system);
		first_tick = false;
	}

	OS.run();
}

# TODO #

1. Make rough kernel structure. Move initialization to kernel routines
2. Basic thread executer
3. Make roomplan:
	- Wave transform to get best storage position
	- Lay paths to the best storage position
	- Draw desired floor plan using new graphics
	- Add buildings to roomplan
	- Should be possible to query buidings from roomplan
4. 



# Room statuses #

By economical use:
0. CAPITAL. Highest room level, no need for external feeding?
1. CITY. Full mining, high room level
2. TOWN. Can pull resources from adjacent remote mines
3. REMOTE_MINE. - remote mining installation. 