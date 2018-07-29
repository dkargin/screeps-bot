'use strict'

global.brain = global.brain || {}
 
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


function checkAlive(objects)
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
        
        this.memory = this.memory || {}

        this.memory = _.defaults(this.memory, {
            room: room.name,
            paused: true,
            personnel: [],
            property: [],
        })

        this.restoreFromMem()
        
        /// Register corporation for specific room
        _.set(brain, ['corporations', name], this)
    }
    
    restoreFromMem()
    {
        /// Load upgrader list from a memory
        if (this.memory.personnel)
        {
            for(var i in this.memory.personnel)
            {
                this.personnel[i] = Game.getObjectById(i)
            }
        }
        
        if (this.memory.property)
        {
            for(var i in this.memory.property)
            {
                this.property[i] = Game.getObjectById(this.memory.property[i])
            }
        }
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
    printData()
    {
        console.log("Corporation " + this.getName() + " has:")
        
        for(let i in this.personnel)
        {
            var record = this.personnel[i]
            console.log("\tpersonnel[" + i + "]=" + JSON.stringify(record))
        }
        
        for(let i in this.property)
        {
            var record = this.property[i]
            console.log("\tproperty[" + i + "]=" + JSON.stringify(record))
        }
    }

    // Get room
    getRoom()
    {
        return Game.rooms[this.memory.room]
    }
    
    // Get headquarter room. Used for providing new creeps and assistance
    getHQRoom()
    {
        return Game.room[this.memory.room]
    }

    // Serialize data to persistent memory
    writeMemory()
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
    calculateExpenses()
    {
        var expenses = 0
        /// TODO: iterate all property and personnal
        return expenses
    }

    // List available actions for specified state
    list_ai_actions(state) {}
    
    // Get current state for AI solver
    current_state() 
    { 
        return {}
    }
    
    // Get corporation name
    // @returns string name
    getName()
    {
        return this.name
    }
    
    // Corporation calls it when a creep is necessary
    requestCreep()
    {
        
    }
}

implant_memory(Corporation.prototype, '_corporations', (obj)=>obj.name)

global.Corporation = Corporation

module.exports = 
{
    /// Add corporation
    addCorp : function(corp)
    {
        
    },
};
