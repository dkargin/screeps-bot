/**
 * Behaviour for simple miner class
 * Simple miners will do all mining stuff until tier4, when corporations take place
 * Will return resources personally until servitor is available
 * Will upgrade its recipe on tier3
 */

var CreepBase = require('creepbase')

/** @param {Creep} creep **/
function process_mining(creep)
{
	/// Go mining
    if(creep.carry.energy < creep.carryCapacity) 
    {
    	var source = creep.pos.findClosestByPath(FIND_SOURCES);
        if(source && creep.harvest(source) == ERR_NOT_IN_RANGE) {
            creep.moveTo(source);
        }
        else
        {
        	creep.target = source
        }
    }
    else
    {
    	var caps = creep.room.get_capabilities()
    	if(!caps.servitor)
    	{
        	creep.set_state('Returning')
        	console.log(creep.name + " has not found servitors. Caps=" + JSON.stringify(caps))
        	creep.say("Return")
    	}
    	else
    	{
    		creep.say("Drop")
    		creep.room.servitor_take(creep.pos, creep.carry.energy)
    		creep.drop(RESOURCE_ENERGY);
    		return true
    	}
    }
}

function process_returning(creep)
{
	if(creep.carry.energy == 0)
	{
		creep.target = 0
		creep.set_state('Job')
		creep.say("Gomine")
		return true
	}
	
	if(!creep.target)
	{
    	var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => 
    		{
                return (structure.structureType == STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity;
            }
        });
    	creep.target = target
    	creep.target_action = () => creep.transfer(creep.target, RESOURCE_ENERGY)
	}
	
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
	return false
}

module.exports = new class extends CreepBase.Behaviour 
{
	role()
	{
		return 'simple.miner'
	}
	
	spawn(room) 
	{
		var tier = room.get_tech_tier()
		if(tier >= 3)
			return {
				name: 'SM', body : unpack_recipe({work:5, carry:2, move:4}), mem : {role:this.role(), tier : 3 }
			} 
		else if(tier == 2)
			return {
				name: 'SM', body : unpack_recipe({work:4, carry:1, move:2}), mem : { role:this.role(), tier: 2 }
			}	
		else
			return {
				name: 'SM', body : unpack_recipe({work:2, carry:1, move:1}), mem : {role:this.role(), tier : 1 }
			}
	}

	/// Return creep capabilities
	get_capabilities()
	{		
		return { mine : this.getActiveBodyparts(WORK) }
	}
	
	get_demands()
	{
		return {
			servitor : 1
		}
	}
	
	get_desired_population(room)
	{
		var tier = room.get_tech_tier()
		if(tier >= 3)
			return 2	/// TODO: number of mines
		return get_mine_spots(room.name)
	}
	
	init(creep)
	{
		//console.log("Overriding miner callbacks for " + creep.name)
		creep.override_states({Job : process_mining,  Returning:process_returning})
	}
};