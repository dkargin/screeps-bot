var roleUpgrader = {
	role : function()
	{
		return 'simple.upgrader'
	},
	body : function()
	{
		return [WORK, WORK, CARRY, MOVE]
	},
	
	spawn : function(room)
	{
		var tier = room.get_tech_tier()
		if(tier > 1)
			return {
				body : [WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE], mem : {
					role:this.role(), tier: 2 }
			}
		return {
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
		var caps = room.get_capabilities()
		if(caps.mine > 0)
			return caps.mine / 2
		return 2
	},
	/// Return creep capabilities
	get_capabilities : function()
	{
		return {upgrade : this.getActiveBodyparts(WORK) }
	},
    /** @param {Creep} creep **/
    run: function(creep) 
    {
    	creep.get_capabilities = this.get_capabilities
    	
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
};

module.exports = roleUpgrader;