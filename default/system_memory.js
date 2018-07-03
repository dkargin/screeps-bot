'use strict'
/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('memory');
 * mod.thing == 'a thing'; // true

 * Module contains memory utilities at system level
 */

global.OS = global.OS || {}

/// Init volatile cache
_.defaults(OS, {
    threads : {},
    cache:
    {
        rooms: {},
        corporations : {},
        creeps: {},
        sources: {},
    },
})

OS.print_memory = function(path)
{
    var data = brain
    var str = JSON.stringify(str)
    console.log("OS data for path " + path + " = " + data)
}
/// @param objects - array of object ids
/// @returns array of objects that are still alive
/// Implants 'memory' property to an object
global.implant_memory = function(classname, location, gid)
{
    if(!gid)
        gid = (obj) => obj.id

    Object.defineProperty(classname, 'memory', {
        get: function() {
            if(_.isUndefined(Memory[location])) {
                Memory[location] = {};
            }
            if(!_.isObject(Memory[location])) {
                return undefined;
            }
            return Memory[location][gid(this)] = Memory[location][gid(this)] || {};
        },
        set: function(value) {
            if(_.isUndefined(Memory[location])) {
                Memory[location] = {};
            }
            if(!_.isObject(Memory[location])) {
                throw new Error('Could not implant memory for class ' + classname.name);
            }
           Memory[location][gid(this)] = value;
        }
    });
}

/// Implants 'cache' property to an object
global.implant_cache = function(classname, location)
{
    Object.defineProperty(classname, 'cache', {
        get: function() {
            if(_.isUndefined(brain.cache[location])) {
                brain.cache[location] = {};
            }
            if(!_.isObject(brain.cache[location])) {
                return undefined;
            }
            return brain.cache[location][this.id] = brain.cache[location][this.id] || {};
        },
        set: function(value) {
            if(_.isUndefined(brain.cache[location])) {
                brain.cache[location] = {};
            }
            if(!_.isObject(brain.cache[location])) {
                throw new Error('Could not implant cache for class ' + classname.name);
            }
           brain.cache[location][this.id] = value;
        }
    });
}
/*
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
}*/

implant_memory(Source.prototype, '_sources');
implant_memory(StructureContainer.prototype, '_containers');
implant_memory(StructureStorage.prototype, '_storages');

implant_cache(Creep.prototype, '_creeps')
implant_cache(Flag.prototype, '_flags')

brain.memory_init = function()
{
    console.log("Initializing BOT memory")

    

    brain.start_tick = Game.time
/*
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
    });*/

    Memory.settings = Memory.settings || {}
}

brain.memory_clean = function()
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