var CreepBase = require('creepbase')

function filter_build_targets(obj)
{
	return true
}

function process_job(creep)
{
	
	if(!creep.has_target())
	{
		console.log(creep.name + " finding closest build target")
		if(creep.find_closest_target(FIND_CONSTRUCTION_SITES, filter_build_targets, 'build'))
		{
			console.log("Found build target")
		}
		else
		{
			console.log("No build target is available")
		}
	}
	else
	{
		var target = Game.getObjectById(creep.memory.target)
		if(target)
		{
			//console.log(creep.name + " going to build at pos " + target.pos)
			if(creep.pos.getRangeTo(target) > 1)
				creep.moveTo(target);
			else
			{
				creep.build(target)
				
				if(creep.carry.energy == 0)
				{
					var need = creep.carryCapacity - creep.carry.energy
					var work = creep.getActiveBodyparts(WORK)
					creep.room.servitor_give(creep, need - creep.carry.energy)
				}
		    }
		}
		else
		{
			creep.clear_target()
		}		
	}
}

module.exports = new class extends CreepBase.Behaviour
{
	role() { return 'simple.builder' }
	
	spawn(room)
	{
		var tier = room.get_tech_tier()
		if(tier > 1)
			return {name : "SB", 
				body : [WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE], mem : {
					role:this.role(), tier: 2 }
			}
		return {name : "SB",
			body : [WORK, WORK, CARRY, MOVE], mem : {
				role:this.role(), tier : 1 }
		}
	}
	
	get_demands()
	{
		return { servitor : 1 }
	}
	
	get_desired_population(room)
	{
		var tier = room.get_tech_tier()
		if(tier > 1)
			return 2
		return 0
	}
	
	/// Return creep capabilities
	get_capabilities()
	{
		return {build : this.getActiveBodyparts(WORK) }
	}
	
	init(creep)
	{
		creep.override_states({Job : process_job})
	}
};
