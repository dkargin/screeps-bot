var CreepBase = require('creepbase')

function process_job(creep)
{
	if(!creep.target)
	{
		if(creep.target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES))
		{
			creep.target_action = () => creep.build(creep.target);
		}
	}
	
	if(creep.target && creep.target_action) 
	{
		if(creep.target_action() == ERR_NOT_IN_RANGE) {
	        creep.moveTo(creep.target);
	    }
	}
	else
	{
		delete creep.target
		delete creep.target_action
	}
	
	if(creep.carry.energy == 0)
	{
		var work = creep.getActiveBodyparts(WORK)
		creep.room.servitor_give(creep, creep.carry.energy / work)
	}
}

module.exports = new class extends CreepBase.Behaviour
{
	role()
	{
		return 'simple.builder'
	}
	
	body()
	{
		return [WORK, WORK, CARRY, MOVE]
	}
	
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
		return {
			servitor : 1
		}
	}
	
	get_desired_population(room)
	{
		return 0
	}
	
	/// Return creep capabilities
	get_capabilities()
	{
		return {build : this.getActiveBodyparts(WORK) }
	}
	
	init(creep)
	{
		creep.get_capabilities = this.get_capabilities	
		creep.override_states({Job : process_job})
	}
};
