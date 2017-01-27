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
        if(_.isUndefined(Memory.sources)) {
            Memory.sources = {};
        }
        if(!_.isObject(Memory.sources)) {
            return undefined;
        }
        return Memory.sources[this.id] = Memory.sources[this.id] || {};
    },
    set: function(value) {
        if(_.isUndefined(Memory.sources)) {
            Memory.sources = {};
        }
        if(!_.isObject(Memory.sources)) {
            throw new Error('Could not set source memory');
        }
        Memory.sources[this.id] = value;
    }
});

Object.defineProperty(StructureContainer.prototype, 'memory', {
    get: function() {
        if(_.isUndefined(Memory.containers)) {
            Memory.containers = {};
        }
        if(!_.isObject(Memory.containers)) {
            return undefined;
        }
        return Memory.containers[this.id] = Memory.containers[this.id] || {};
    },
    set: function(value) {
        if(_.isUndefined(Memory.containers)) {
            Memory.containers = {};
        }
        if(!_.isObject(Memory.containers)) {
            throw new Error('Could not set source memory');
        }
        Memory.containers[this.id] = value;
    }
});


Object.defineProperty(StructureStorage.prototype, 'memory', {
    get: function() {
        if(_.isUndefined(Memory.storages)) {
            Memory.storages = {};
        }
        if(!_.isObject(Memory.storages)) {
            return undefined;
        }
        return Memory.storages[this.id] = Memory.storages[this.id] || {};
    },
    set: function(value) {
        if(_.isUndefined(Memory.storages)) {
            Memory.storages = {};
        }
        if(!_.isObject(Memory.storages)) {
            throw new Error('Could not set source memory');
        }
        Memory.storages[this.id] = value;
    }
});


module.exports = {

};