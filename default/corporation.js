
global.brain = global.brain || {}
 
var Rooms = require("utils.room")
//var Actions = require("threads")

/// Storage for corporation types
/// Will be used for memory state restoration
brain.CorporationTypes = brain.CorporationTypes || {}

/// Storage for corporation instances
/// Maps room name to list of corporations
brain.corporations = {}

/// List room corporations
Room.prototype.list_corps = function()
{
    var corps = []
    for(var c in brain.corporations[this.name])
    {
        corps.push(c)
    }
    console.log("Room " + this.name + " corporations=" + corps)
    return corps
}

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

// Check if object is alive
function isAlive(objid)
{
    if (!objid)
        return false;
    var obj = Game.getObjectById(objid)
    if (!obj || obj.hits == 0)
        return false
    return true
}

/// Base class for all corporations
///  - 'property' - a map of buildings that company owns
///  - 'personnel' - corporation's personnel. Maps some 'position' to a creep
/// Corporation name is encoded by {corptype}@room
class Corporation
{
    constructor(basename, room)
    {
        var name = basename + "@" + room.name
        this.name = name
        this.room = room

        /// Room personnel. Array of indices
        this.personnel = {}
        /// Room property. Maps object role to object id
        this.property = {}

        this.memory = _.default(this.memory, {
            room: room.name,
            paused: true,
            personnel: {},
            property: {},
        })

        /// Load upgrader list from a memory
        for(var i in this.memory.personnel)
        {
            this.personnel[i] = Game.getObjectById(i)
        }
        for(var i in this.memory.property)
        {
            this.property[i] = Game.getObjectById(this.memory.property[i])
        }

        /*
        if(name in Corporations)
        {
            throw("Corporation " + name + " is already registered")
        }*/
        
        /// Register corporation for specific room
        _.set(brain, ['corporations', name], this)
    }
    
    getPersonnel()
    {
        return personnel;
    }
    
    // Get current vacant spots
    getVacancies()
    {
        var result = []
        var personnel = this.getPersonnel()
        for(var s in personnel)
        {
            if (isAlive(personnel[s]))
                result.push(s)
        }
        return result
    }

    // Print corp property to console
    print_property()
    {

    }

    /// Get room
    get_room()
    {
        return Game.rooms[this.memory.room]
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

    /// List available actions for specified state
    list_ai_actions(state) {}
    
    /// Get current state for AI solver
    current_state() 
    { 
        return {}
    }
    
    // Corporation calls it when a creep is necessary
    requestCreep()
    {
        
    }
}
/*
 *
 */

implant_memory(Corporation.prototype, '_corporations', (obj)=>obj.name)

global.Corporation = Corporation

module.exports = 
{
    /// Add corporation
    addCorp : function(corp)
    {
        
    },
    
    // Should we do it, or pass it to corporation-specific thread?
    update : function()
    {
        for(var c in Corporations)
        {
            Corporations[c].update()
        }
    }
};


/*
AI Advisor iterates all corporations for list of available actions and chooses the one with best overall metric

list_ai_actions(state) - corporation should list its available actions

state = 
{
    tier - room tier
    harvest_rate - current harvest estimation
    upgrade_rate - current upgrade rate
}

Upgrader Actions:
    SpawnUpgrader = SpawnUnit(body, provides={upgrading: numbody, limited by state harvest rate and build distribution})
    build chest = BuildStructure(chest)
    build road = BuildStructure(road)

Builder:
    SpawnBuilder = SpawnUnit(body, provides={building: numbody})

*/