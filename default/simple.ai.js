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
	'simple.upgrader' : require('simple.upgrader'),
	'simple.miner' : require('simple.miner')
}
 
function simple_ai()
{
	console.log("Processing simple AI tick=" + Game.time)
	var population = {}
	
	/// Process simple behaviours
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
	
	for(var rname in population)
	{
		var roomPop = population[room]
		var room = Game.rooms[rname]
		
		for(var role in roomPop)
		{
			var pop = roomPop[role]
			var controller = simpleBehaviours[role]
			//console.log("spawn", "Role="+role+" has pop=" +pop + " req="+ controller.get_required())
			var spawns = room.find(FIND_SPAWNS)
			if(spawns.length == 0)
				continue
				
			var spawn = spawns[0]
			
			if(pop < controller.get_required(rooms))
			{   
				var desc = controller.spawn(room)
				var name = spawn.new_name(role) 
				
				var result = spawn.createCreep(desc.body, name, desc.mem)
				if(_.isString(result)) 
				{
					//console.log("spawn", "Spawned role="+role+" name="+name+" desc.name="+desc.role + " body=" + desc.body)
					spawn.next_name()
					break
				}
				else if(result == ERR_NAME_EXISTS)
				{
					spawn.next_name()
				}
				else
				{
				    //console.log("Failed to spawn="+result)
				}
			}
		}
	}
}

module.exports = {
    run : simple_ai,
};