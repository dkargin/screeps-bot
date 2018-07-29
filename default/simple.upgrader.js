var CreepBase = require('./creepbase')

function process_job(creep)
{
	var inrange = creep.pos.inRangeTo(creep.room.controller, 1)
		
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
	    {
			creep.room.servitor_give(creep, need)
		}
	}
}

class SimpleUpgrader extends CreepBase.Behaviour
{
    constructor()
    {
        super()
        console.log("SimpleUpgrader constructor done")
    }
    
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
				name: 'SU', body : unpack_recipe({work:8, carry:4, move:4}), mem : {role:this.role(), tier : 4 }
			}
		else if(tier == 3)
			return {
				name: 'SU', body : unpack_recipe({work:6, carry:2, move:2}), mem : {role:this.role(), tier : 3 }
			} 
		else if(tier == 2)
			return {
				name: 'SU', body : unpack_recipe({work:4, carry:1, move:2}), mem : { role:this.role(), tier: 2 }
			}	
		else
			return {
				name: 'SU', body : unpack_recipe({work:2, carry:1, move:1}), mem : {role:this.role(), tier : 1 }
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
	getCapabilities(creep)
	{
		return {upgrade : creep.getActiveBodyparts(WORK) }
	}
	
    init(creep)
	{	
    	//console.log("Overriding upgrader callbacks for " + creep.name)
		creep.overrideStates({Job : process_job})
	}
}

module.exports = new SimpleUpgrader()