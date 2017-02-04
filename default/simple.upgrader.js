var CreepBase = require('creepbase')

function process_job(creep)
{
	var inrange = creep.pos.inRangeTo(creep.room.controller, 1)
	//creep.memory.inrange = creep.memory.inrange || false
	
	//if(!creep.memory.inrange && )
	//	creep.memory.inrange = true
		
	if(!inrange) 
	{
		creep.moveTo(creep.room.controller);
	}
	else 
	{
		creep.upgradeController(creep.room.controller);
    }
	
	var work = creep.getActiveBodyparts(WORK)
	
	if(creep.carry.energy <= work*2)
	{
		var need = creep.carryCapacity - creep.carry.energy
		/*
		var filter = (flag) =>
    	{
    		return flag.memory.type == "servitor"
    	}
    	var flags = creep.pos.findInRange(FIND_FLAGS, 1, { filter: filter } );
	    if(flags[0] && flags[0].pick_task_flag(creep))
	    {
	    	
	    }
	    else*/
	    {
			creep.room.servitor_give(creep, need)
		}
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
		
		if(tier >= 4)
			return {
				name: 'SU', body : room.unpack_recipe({work:8, carry:4, move:4}), mem : {role:this.role(), tier : 4 }
			}
		else if(tier == 3)
			return {
				name: 'SU', body : room.unpack_recipe({work:6, carry:2, move:2}), mem : {role:this.role(), tier : 3 }
			} 
		else if(tier == 2)
			return {
				name: 'SU', body : room.unpack_recipe({work:4, carry:1, move:2}), mem : { role:this.role(), tier: 2 }
			}	
		else
			return {
				name: 'SU', body : room.unpack_recipe({work:2, carry:1, move:1}), mem : {role:this.role(), tier : 1 }
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
		if(caps.mine === 0)
			return 0
		//if(caps.mine > 0)
		//	return caps.mine / 2
		return 2
	}
	/// Return creep capabilities
	get_capabilities()
	{
		return {upgrade : this.getActiveBodyparts(WORK) }
	}
	
    init(creep)
	{	
    	//console.log("Overriding upgrader callbacks for " + creep.name)
		creep.override_states({Job : process_job})
	}
};