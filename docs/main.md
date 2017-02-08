
# TODO #
1. upgrader corp
	- find best location for logistics center:
		- calculate distance map for each logistic object
		- pick a point with least sum of a distances
		- skip occupied slots
	- mark rail spots from logistics center
	- calculate upgrader spots
1. population management. Tier upgrades and creep renewal
	- 
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

