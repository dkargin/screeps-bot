module.exports = {
	role : function()
	{
		return 'simple.builder'
	},
	body : function()
	{
		return [WORK, WORK, CARRY, MOVE]
	},
	
	spawn : function(room)
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
	},
	
	get_demands : function()
	{
		return {
			servitor : 1
		}
	},
	
	get_desired_population: function(room)
	{
		return 2
	},
	
	/// Return creep capabilities
	get_capabilities : function()
	{
		return {build : this.getActiveBodyparts(WORK) }
	},
    /** @param {Creep} creep **/
    run: function(creep) 
    {
    	creep.get_capabilities = this.get_capabilities
    	
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
};
