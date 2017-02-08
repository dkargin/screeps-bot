/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('memory');
 * mod.thing == 'a thing'; // true
 */
 
/// @param objects - array of object ids
/// @returns array of objects that are still alive
Game.check_alive = function(objects)
{
    var alive = []
    for(var i in objects)
    {
        var obj = Game.getObjectById(objects[i])
        if(obj)
            movers.push(ob)
    }
    return alive
}


Object.defineProperty(Source.prototype, 'memory', {
    get: function() {
        if(_.isUndefined(Memory._sources)) {
            Memory._sources = {};
        }
        if(!_.isObject(Memory._sources)) {
            return undefined;
        }
        return Memory._sources[this.id] = Memory._sources[this.id] || {};
    },
    set: function(value) {
        if(_.isUndefined(Memory._sources)) {
            Memory._sources = {};
        }
        if(!_.isObject(Memory._sources)) {
            throw new Error('Could not set source memory');
        }
        Memory._sources[this.id] = value;
    }
});

Object.defineProperty(StructureContainer.prototype, 'memory', {
    get: function() {
        if(_.isUndefined(Memory._containers)) {
            Memory._containers = {};
        }
        if(!_.isObject(Memory._containers)) {
            return undefined;
        }
        return Memory._containers[this.id] = Memory._containers[this.id] || {};
    },
    set: function(value) {
        if(_.isUndefined(Memory._containers)) {
            Memory._containers = {};
        }
        if(!_.isObject(Memory._containers)) {
            throw new Error('Could not set source memory');
        }
        Memory._containers[this.id] = value;
    }
});


Object.defineProperty(StructureStorage.prototype, 'memory', {
    get: function() {
        if(_.isUndefined(Memory._storages)) {
            Memory._storages = {};
        }
        if(!_.isObject(Memory._storages)) {
            return undefined;
        }
        return Memory.storages[this.id] = Memory._storages[this.id] || {};
    },
    set: function(value) {
        if(_.isUndefined(Memory._storages)) {
            Memory._storages = {};
        }
        if(!_.isObject(Memory._storages)) {
            throw new Error('Could not set source memory');
        }
        Memory._storages[this.id] = value;
    }
});

module.exports = {
	clean_memory : function()
	{
		for(var i in Memory.creeps) {
	        if(!Game.creeps[i]) {
	            delete Memory.creeps[i];
	        }
	    }
		
		for(var i in Memory._storages)
		{
			var obj = Game.getObjectById(i)
			if(!obj)
				delete Memory._storages[i]
		}

        for(var i in Memory.flags)
        {
            var flag = Game.flags[i]
            if(!flag)
                delete Memory.flags[i]
        }
	}
};