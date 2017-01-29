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
		if(caps.miner > 0)
			return caps.mine / 2
		return 0
	},
	/// Return creep capabilities
	get_capabilities : function()
	{
		return {upgrade : this.getActiveBodyparts(WORK) }
	},
    /** @param {Creep} creep **/
    run: function(creep) 
    {
    	if(!creep.get_capabilities)
    		creep.get_capabilities = this.get_capabilities

        if(creep.memory.upgrading && creep.carry.energy == 0) {
            creep.memory.upgrading = false;
            creep.say('harvesting');
        }
        if(!creep.memory.upgrading && creep.carry.energy == creep.carryCapacity) {
            creep.memory.upgrading = true;
            creep.say('upgrading');
        }

        if(creep.memory.upgrading) {
        	if(!creep.pos.inRangeTo(creep.room.controller, 2))
        		creep.moveTo(creep.room.controller);
        	else {
        		//(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE)
        		creep.upgradeController(creep.room.controller);
            }
        }
        else {
            var source = creep.pos.findClosestByPath(FIND_SOURCES);
            if(source && creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source);
            }
        }
    }
};

module.exports = roleUpgrader;