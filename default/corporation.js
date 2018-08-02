'use strict'

global.brain = global.brain || {}
 
/// Storage for corporation types
/// Will be used for memory state restoration
brain.CorporationTypes = brain.CorporationTypes || {}

/**
 * Storage for corporations. Maps corporation name to a corporation instance
 */
var Corporations = {}

/**
 * Storage for rooms, that contain corporations
 * Maps room name to a list of corporations
 */
var RoomCorporations = {}

/**
 * Storage for rooms, that provide spawning/support service for corporations
 * Maps room name to a list of corporations 
 */
var RoomServicedCorporations = {}

/// Get a list of corporations, that are operating in this room
Room.prototype.getCorporations = function()
{
    var corps = []
    for(var c in RoomCorporations[this.name])
    {
        corps.push(c)
    }
    return corps
}

/// Get a list of corporations, that are serviced by this room
Room.prototype.getRoomServicedCorporations = function()
{
    var corps = []
    for(var c in RoomServicedCorporations[this.name])
    {
        corps.push(c)
    }
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
        Corporations['name'] = this
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
    
    // Return a copy of a corp's personnel
    getPersonnel()
    {
        return personnel.slice();
    }
    
    // Get current vacant spots
    getVacancies()
    {
        var result = []
        var personnel = this.getPersonnel()
        for(var s in personnel)
        {
        	var rec = personnel[s]
        	if (!rec)
        		throw new Error("Invalid position " + s + " in corp " + this.getName())
            if (!rec.id)
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
            console.log("\tpersonnel[\"" + i + "\"]=" + JSON.stringify(record))
        }
        
        for(let i in this.property)
        {
            var record = this.property[i]
            console.log("\tproperty[\"" + i + "\"]=" + JSON.stringify(record))
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
    
    // Get all jobs starting with jobName string
    // @returns {Array} - array of job names
    getJobs(jobName)
    {
    	var result = []
    	for(var j in this.personnel)
    	{
    		if (j.startsWith(jobName))
    		{
    			result.push(j);
    		}
    	}
    	return result
    }
    
    // Get unoccupied jobs
    // @returns {Array} - array of job names
    getEmptyJobs(jobName)
    {
    	var result = {}
    	for(var j in this.personnel)
    	{
    		if (j.startsWith(jobName))
    		{
    			var rec = this.personnel[j]
    			result.push(j) = this.personnel[j]
    		}
    	}
    	return result
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
    
    // Should check current personnel
    checkPersonnel()
    {
    	
    }
    
    // Regular per-tick update
    update()
    {
        var name = this.getName()
    	console.log("Corporation " + name + " is working hard")
    	
        this.checkPersonnel()
        
        var room = this.getRoom()

        for (let j in this.personnel)
    	{
        	var rec = this.personnel[j]
        	var creep = rec.creep
        	if (!creep)
        		continue
        	var behaviour = creep.getBehaviour()
        	behaviour.run(creep, this, rec)
    	}
    }
}

global.Corporation = Corporation

module.exports = 
{
};
