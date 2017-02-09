/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('corporation');
 * mod.thing == 'a thing'; // true
 */

require('memory')
 
var Rooms = require("utils.room")
//var Actions = require("threads")

/// Storage for corporation types
/// Will be used for memory state restoration
brain.CorporationTypes = brain.CorporationTypes || {}

/// Storage for corporation instances
var Corporations = {}

function check_alive(objects)
{
    var alive = []
    for(var i in objects)
    {
        var obj = Game.getObjectById(objects[i])
        if(obj)
            alive.push(ob)
    }
    return alive
}

/// Base class for all corporations
///  - 'property' - a map of objects that company owns
///  - 'personnel' - corporation's personnel
class Corporation 
{
    constructor(name)
    {
        /// Room personnel. Array of indices
        this.personnel = []
        /// Room property. Maps object role to object id
        this.property = {}

        this.memory.personnel = this.memory.personnel || []
        this.memory.property = this.memory.property || {}

        /// Load upgrader list from a memory
        for(var i in this.memory.personnel)
        {
            this.personnel[i] = Game.getObjectById(i)
        }
        for(var i in this.memory.property)
        {
            this.property[i] = Game.getObjectById(this.memory.property[i])
        }
    }

    /// Print corp property to console
    print_property()
    {

    }

    /// Serialize data to persistent memory
    write_memory()
    {
        /// Update personnel data
        this.memory.personnel = []
        for(var i in this.personnel)
        {
            this.memory.personnel.push(i)
        }
        /// Update property data
        this.memory.property = {}
        for(var i in this.property)
        {
            this.memory.property[i] = this.property[i].id
        }
    }

    /// Calculate corporation expenses 
    calculate_expenses()
    {
        var expenses = 0
        /// TODO: iterate all property and personnal
        return expenses
    }
}

implant_memory(Corporation.prototype, '_corporations')

class UpgradeCorp extends Corporation
{
    /// Initializes upgrade crom from a room reference
    constructor(room)
    {
        this.personnel = {}
        this.memory.personnel = this.memory.personnel || []

        /// Load upgrader list from a memory
        for(var i in this.memory.personnel)
        {
            this.personnel[i] = Game.getObjectById(i)
        }
        
        this.controller = room.controller
        /// TODO: find appropriate container
        /// - also find designated container as well
    }

    /// Called when logistics center is moved to another location
    /// We need to recalculate all the paths
    set_logistics_center(center)
    {

    }

  
    update()
    {
        var population = 0;
        for(var i in this.personnel)
        {
            var obj = this.personnel[i]
        }
        write_memory()
    }
}

/// Corporation that manages spawning process
class SpawnCorp
{
    /// Initializes upgrade crom from a room reference
    constructor(spawn)
    {
        this.personnel = {}
        this.memory.personnel = this.memory.personnel || []

        /// Load upgrader list from a memory
        for(var i in this.memory.personnel)
        {
            this.personnel[i] = Game.getObjectById(i)
        }
        
        this.controller = room.controller
        /// TODO: find appropriate container
        /// - also find designated container as well
    }
}


module.exports = 
{
    /// Register corporation class
    registerType : function(cls)
    {
        CorporationTypes[cls.name] = cls  
    },
    /// Add corporation
    addCorp : function(corp)
    {
        
    },
    
    update : function()
    {
        for(var c in Corporations)
        {
            Corporations[c].update()
        }
    }
};