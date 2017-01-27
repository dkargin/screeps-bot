/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('corporation');
 * mod.thing == 'a thing'; // true
 */
 
Rooms = require("utils.room")
Actions = require("utils.action")

/// Storage for corporation types
/// Will be used for memory state restoration
var CorporationTypes = {}

/// Storage for corporation instances
var Corporations = {}

check_alive = function(objects)
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

/// Mining corporation
/** 
 * Mining corporation consists of:
 * - miner
 * - storage nearby the mine
**/
class MineCorp extends Actions.MetaObject
{
    constructor(mine, unload_obj)
    {
        var name = "MineCorp" + mine.id
        super(name)
        
        Corporations[name] = this
        
        this.name = name
        
        this.memory.mine_id = mine.id
        
        this.memory.unload_id = unload_obj.id
        // Identifier of drill creep
        this.memory.drill = this.memory.drill || "" 
        // Intermediate storage for a drill
        this.memory.storage = this.memory.storage || ""
        // Array of mover creeps. They move res from drill/storage 
        // to destination storage
        this.memory.movers = this.memory.movers || []
        /// Arraty of simple workers. They do the stuff in first period of the game
        /// Later they are replaced by a drill creeps
        this.memory.workers = this.memory.workers || []
        /// Mine starts paused. Main manager decides when to activate specific mine
        this.memory.paused = this.memory.paused || true
        /// Contains current storage state
        this.memory.storage = 0
        
        this.check_path()
    }
    
    /// Check precompiled paths
    check_path()
    {
        /// TODO: implement precompiled paths when CPU limit will be near
    }
    
    /// Get corporation name
    corp_name()
    {
        return this.name
    }
    
    /// Check whether corp has valid storage
    has_storage()
    {
        return this.memory.storage
    }
    
    /// Set new unload position
    /// All workers should adapt properly to this change
    set_unload_destination()
    {
        /// TODO: implement
    }
    
    /// Get mine object
    get_mine()
    {
        return Game.getObjectById(this.memory.mine_id)
    }
    
    /// Get room
    get_room()
    {
        return this.get_mine().room
    }
    
    /// Get dat drill
    get_drill()
    {
        return Game.getObjectById(this.memory.drill)
    }
    
    /// Check if personnel is alive. Remove personal that is dead
    check_personnel()
    {
        this.memory.movers = check_alive(this.memory.movers)
        this.memory.workers = check_alive(this.memory.movers)
    }
    
    /// Calculates mover performance, average energy per tick
    transfer_rate(obj, distance)
    {
        if(!obj)
            return 0
        var nmove = obj.getActiveBodyparts(Game.MOVE)
        var ncarry = obj.getActiveBodyparts(Game.CARRY)
        return 25*nstore*nmove / (distance*(nmove + 2*nstore))
    }
    
    total_transfer_rate()
    {
        /// TODO: Calculate effective distance, checking the roads
        var distance = this.memory.distance
        var income = 0
        
        for(var m in this.memory.movers)
        {
            var obj = Game.getObjectById(this.memory.movers[m])
            if(obj)
                income += this.transfer_rate(obj, distance)
        }
        
        return income
    }

    /// Checks whether mine has enough movers
    /// @returns {number} positive number,  if enough
    check_movers_enough()
    {
        var mine_income = this.get_mine_income()
        var transfer = this.get_transfer_rate()
        return transfer - mine_income
    }
    
    mine_rate(obj)
    {
        if(!obj)
            return 0
        var nwork = obj.getActiveBodyparts(Game.WORK)
        return 2*nwork
    }
    
    /// Get average mine income, per tick
    get_mine_income()
    {
        var income = 0
        income += (this.mine_rate(Game.getObjectById(this.memory.drill
        for(var m in this.memory.workers)
        {
            var obj = Game.getObjectById(this.memory.workers[m])
            if(obj)
                income += this.mine_rate(obj, distance)
        }
        return income
    }
    
    get_unload_pos()
    {
        var obj = Game.getObjectById(this.memory.unload_id)
        return Game.getObjectPos(obj)
    }
    
    analyse_mine()
    {
        var mine = this.get_mine()
        
        var pos = this.get_unload_pos()
        
        var storage_sites = pos.findInRange(FIND_STRUCTURES, 2, 
        {
            filter: { structureType: STRUCTURE_CONTAINER }
        });

        for(var s in storage_sites)
        {
            this.memory.storage = 2
            storage_sites[s].memory = storage_sites[s].memory || {}
            storage_sites[s].memory.type = "source"
            storage_sites[s].memory.corp = this.corp_name()
        }

        console.log("Corp " + this.corp_name() + " has found " + storage_sites.length + " storage sites near mine " + mine.id)

        if(this.memory.storage < 2)
        {
            var storage_build_sites = mine.pos.findInRange(FIND_CONSTRUCTION_SITES, 2, 
            {
                filter: { structureType: STRUCTURE_CONTAINER }
            });
            
            if(storage_build_sites.length > 0)
                this.memory.storage = 1
        }
        
        console.log("Found "+storage_build_sites.length + " storage build sites near mine " + mine.id)
        
        var path = pos.findPathTo(mine.pos)
        this.memory.distance = path.length
        
        var max = 0
        var storage_pos
        
        if(path)
        {
            var finish = path[path.length-2];
            
            if(this.has_storage() == 0)
            {
                storage_pos = new RoomPosition(finish.x, finish.y, pos.roomName)
                mine.room.createConstructionSite(pos, STRUCTURE_CONTAINER);
            }
        }
    }
    
    /// Event handler for created drill
    on_spawned_drill(obj)
    {
        console.log("MineCorp"+this.corp_name()+" got new drill")
    }
    
    /// Event handler for created mover
    on_spawned_mover(obj)
    {
        console.log("MineCorp"+this.corp_name()+" got new mover")
    }
    
    /// Event handler for created worker
    on_spawned_worker(obj)
    {
        console.log("MineCorp"+this.corp_name()+" got new workerl")
    }
    
    update()
    {
        var name = this.corp_name()
        console.log("Corporation " + name + " is working hard")
        this.check_personnel()
        var room = this.get_room()
        if(!this.memory.drill)
        {
            console.log("Spawning a drill for the mine corp" + name)
            var recipe =
            {
                name: "drill",
                memory: 
                {
                    role: "drill",
                    occupation: name
                },
            }
            
            var res = room.spawn(recipe, this.registerEvent(this.on_spawned_drill))
        }
        else if(!this.check_movers_enough())
        {
            console.log("Spawning a mover for the mine corp" + name)
            var recipe =
            {
                name: "drill",
                memory: 
                {
                    role: "drill",
                    occupation: name
                },
            }
            
            var res = room.spawn(recipe, this.registerEvent(this.on_spawned_drill))
        }
    }
}

function getCorpForMine(mine, center)
{
    if(mine.memory.corp)
    {
        corp = Corporations[mine.memory.corp]
        if(corp)
            return corp
    }
    return new MineCorp(mine, center)
}

/** Will find and fill in mining spots **/
/** @param (RoomPosition) pos - central position **/
Room.prototype.analyse_mines=function(center)
{
    var pos = Game.getObjectPos(center)
    //console.log("Updating mine info")
    var sources = this.find(FIND_SOURCES);
    //var pos = spawn.pos
    
    for(var i in sources)
    {
        var mine = sources[i]
        
        var corp = getCorpForMine(mine, center)
            
        mine.memory.corp = corp.name
        
        corp.analyse_mine()
        
        //mine.memory = _.merge(mine.memory, info)
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