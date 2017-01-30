var CreepBase = require('creepbase')

function process_job(creep)
{
	creep.memory.inrange = creep.memory.inrange || false
	
	if(!creep.memory.inrange && creep.pos.inRangeTo(creep.room.controller, 2))
		creep.memory.inrange = true
		
	if(!creep.memory.inrange) {
		creep.moveTo(creep.room.controller);
	}
	else 
	{
		creep.upgradeController(creep.room.controller);
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
		return 'simple.upgrader'
	}
	
	body()
	{
		return [WORK, WORK, CARRY, MOVE]
	}
	
	spawn(room)
	{
		var tier = room.get_tech_tier()
		if(tier > 1)
			return { name : "SU",
				body : [WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE], mem : {
					role:this.role(), tier: 2 }
			}
		return {name : "SU",
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
		var caps = room.get_capabilities()
		return 1
		if(caps.mine > 0)
			return caps.mine / 2
		return 2
	}
	/// Return creep capabilities
	get_capabilities()
	{
		return {upgrade : this.getActiveBodyparts(WORK) }
	}
	
    init(creep)
	{	
    	console.log("Overriding upgrader callbacks for " + creep.name)
		creep.override_states({Job : process_job})
	}
};