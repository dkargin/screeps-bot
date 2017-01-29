/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('simple.ai');
 * mod.thing == 'a thing'; // true
 */
 

/// Simple behaviours from tutorial
var simpleBehaviours =
{
	'simple.miner' : require('simple.miner'),
	'simple.servitor' : require('simple.servitor'),
	'simple.upgrader' : require('simple.upgrader'),
	
}
 
function simple_ai()
{
	console.log("Processing simple AI tick=" + Game.time)
	var population = {}
	for(var r in Game.rooms)
	{
		population[r] = {}
	}
	/// Process simple behaviours
	/// It also counds role population for each room
    for(var c in Game.creeps) 
    {
    	var obj = Game.creeps[c]
    	//console.log(c, Game.creeps[c])
    	if(!obj)
    	    continue
    	var role = obj.memory.role
    	if(obj && obj.memory.role in simpleBehaviours)
		{
		    var role =  obj.memory.role
		    var rname = obj.pos.roomName
    		simpleBehaviours[role].run(obj)
    		
    		population[rname] = population[rname] || {}
		    
		    if(!population[rname][role])
		    	population[rname][role] = 1
	    	else
	    		population[rname][role] ++
		}
    }
	
	//console.log("Current population: " + JSON.stringify(population))
	
	for(var rname in population)
	{
		var roomPop = population[rname]
		var room = Game.rooms[rname]
		var spawns = room.find(FIND_MY_SPAWNS)
		
		if(spawns.length == 0)
		{
			console.log("No spawns at room " + rname)
			continue
		}
		var spawn = spawns[0]
		if(spawn.spawning)
		{
			//console.log("Spawn is spawning" + rname)
			continue
		}
		
		for(var role in simpleBehaviours)
		{
			var pop = roomPop[role] || 0
			var controller = simpleBehaviours[role]
			//console.log("spawn", "Role="+role+" has pop=" +pop + " req="+ controller.get_desired_population(room))
			
			if(pop < controller.get_desired_population(room))
			{   
				var desc = controller.spawn(room)
				var name = spawn.new_name(role) 
				
				var result = spawn.createCreep(desc.body, name, desc.mem)
				if(_.isString(result)) 
				{
					console.log("spawn", "Spawned role="+role+" name="+name+" desc.name="+desc.role + " body=" + desc.body)
					spawn.next_name()
					break
				}
				else if(result == ERR_NAME_EXISTS)
				{
					spawn.next_name()
				}
				else
				{
				    //console.log("Failed to spawn body " + desc.body + " : "+result)
				}
			}
		}
	}
}

module.exports = {
    run : simple_ai,
};