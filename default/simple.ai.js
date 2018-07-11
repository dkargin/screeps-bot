/* Main module for simple ai
 * It should develop a colony up to tier4, then be replaced by another ai
 */

var HoP = require('spawner')
/// Simple behaviours from tutorial
var simpleBehaviours =
{
	'simple.miner' : require('simple.miner'),
	'simple.servitor' : require('simple.servitor'),
	'simple.builder' : require('simple.builder'),
	'simple.upgrader' : require('simple.upgrader'),
}

var firstTick = true

function simple_ai_init()
{
    
}

function simple_ai_run()
{
    console.log("simple.ai starting tick " + Game.time)
	var errors = []
	var population = {}
	
	simpleBehaviours["simple.servitor"].check_tasks()
	
	for(var r in Game.rooms)
	{
		population[r] = {}
	}
	
	for(var r in Memory.servitor_give)
	{
		var obj = Game.getObjectById(r)
		if(!obj)
		{
			console.log("Cleaning servitor_give with id=" + r)
			delete Memory.servitor_give[r]
		}
	}
	
	console.log("simple.ai done checking servitors")
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
		    
		    //try
		    {
			    if(!obj.spawning)
			    {
			    	simpleBehaviours[role].run(obj, firstTick)
			    }
			}/*
		    catch(ex)
		    {
		    	console.log("Failed to call role.run " + role + " err=" + ex)
		    	throw(ex)
		    	errors.push(ex)
		    }*/
    		
    		population[rname] = population[rname] || {}
		    
		    if(!population[rname][role])
		    	population[rname][role] = 1
	    	else
	    		population[rname][role] ++
		}
    }
    
    console.log("simple.ai processing spawns")
    /// Now we do process spawn
	for(var rname in population)
	{
		var roomPop = population[rname]
		var room = Game.rooms[rname]
		var spawns = room.find(FIND_MY_SPAWNS)
		
		console.log("AI Tick " + Game.time + " room " + rname + " pop=" + JSON.stringify(population) + " caps=" + JSON.stringify(room.get_capabilities(true)) + " tier=" + room.get_tech_tier() + " cap="+room.energyCapacityAvailable)
    		
		if(spawns.length == 0)
		{
			console.log("No spawns at room " + rname)
			continue
		}
		var spawn = spawns[0]
		if(spawn.spawning)
		{
			console.log("Spawn is spawning" + rname)
			continue
		}
		
		for(var role in simpleBehaviours)
		{
			var pop = roomPop[role] || 0
			var controller = simpleBehaviours[role]
			console.log("spawn", "Role="+role+" has pop=" +pop + " req="+ controller.get_desired_population(room))
			
			if(pop < controller.get_desired_population(room))
			{   
				var desc = controller.spawn(room)
				var name = spawn.new_name(desc.name || role) 
				
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
				    console.log("Failed to spawn " + name + "=" + desc.body + " : "+result)
				}
			}
		}
	}
	
	firstTick = false
	
	for(var err in errors)
		throw(err)
		
	console.log("simple.ai tick " + Game.time + " done")
}

module.exports = 
{
    run : simple_ai_run,
    init: simple_ai_init,
};