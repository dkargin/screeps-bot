/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('corporation');
 * mod.thing == 'a thing'; // true
 */
 
var Rooms = require("utils.room")
var Actions = require("utils.action")

/// Storage for corporation types
/// Will be used for memory state restoration
var CorporationTypes = {}

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

/// Mining corporation
/** 
 * Mining corporation consists of:
 * - miner
 * - storage nearby the mine
**/
class MineCorp extends Actions.EventHandler
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
    
    id()
    {
        return this.name
    }
    
    /// How much we need to invest to make optimal revenue
    investment_cost()
    {
    	var store_cost = 5000
    	/// Cost for road construction
    	var road_cost = 300*(this.memory.distance || 0) /// TODO: implement
    	/// Drill cost
    	var miner_cost = 0		// TODO: calculate
    	/// Total cost for all movers
    	var movers_cost = 0
    	return store_cost + road_cost + miner_cost + movers_cost
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
        income += this.mine_rate(Game.getObjectById(this.memory.drill))
        for(var m in this.memory.workers)
        {
            var obj = Game.getObjectById(this.memory.workers[m])
            if(obj)
                income += this.mine_rate(obj, distance)
        }
        
        var max_income = 4000/300
        if(income > max_income)
            income = max_income
        return income
    }
    
    get_unload_pos()
    {
        var obj = Game.getObjectById(this.memory.unload_id)
        return Game.getObjectPos(obj)
    }
    
    /// Calculate data for a mine
    analyse_mine()
    {
    	var msg = ""
        var mine = this.get_mine()
        
        var pos = this.get_unload_pos()
        
        var tier = mine.room.get_tech_tier()
        
        var storage_sites = mine.pos.findInRange(FIND_STRUCTURES, 2, 
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
        
        var storage_build_sites = mine.pos.findInRange(FIND_CONSTRUCTION_SITES, 2, 
        {
            filter: { structureType: STRUCTURE_CONTAINER }
        });

        if(this.memory.storage < 2)
        {
            if(storage_build_sites.length > 0)
                this.memory.storage = 1
        }
        
        //console.log("Found "+storage_build_sites.length + " storage build sites near mine " + mine.id)
        msg = msg+(this.corp_name() + " storages=" + storage_sites.length)
        
        var path = pos.findPathTo(mine.pos)
        this.memory.distance = path.length
        
        var max = 0
        var storage_pos
        var spots = mine.pos.list_free_spots()
        
        mine.memory.spots = spots.length
        
        if(path)
        {
            var finish = path[path.length-2];
            
            if(this.has_storage() == 0 && tier > 1)
            {
                storage_pos = new RoomPosition(finish.x, finish.y, pos.roomName)
                mine.memory.drop_x = finish.x
                mine.memory.drop_y = finish.y
                var result = mine.room.createConstructionSite(storage_pos, STRUCTURE_CONTAINER);
                if(result != OK)
                {
                	msg += ("- build pos=" + storage_pos + " failed: " + result)
                }
            }
        }
        
        //if(msg.lenth > 0)
        console.log(msg)
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
        console.log("MineCorp"+this.corp_name()+" got new worker")
    }
    
    update()
    {
        var name = this.corp_name()
        console.log("Corporation " + name + " is working hard")
        this.check_personnel()
        var room = this.get_room()
        
        if(!this.memory.drill && !this.memory.drill_queued)
        {
            console.log("Spawning a drill for the mine corp" + name)
            var recipe =
            {
                name: "drill",
                body: [Game.WORK, Game.WORK, Game.CARRY, Game.MOVE],
                memory: 
                {
                    role: "drill",
                    occupation: name
                },
            }
            
            var res = room.enqueue(recipe, this.event(this.on_spawned_drill))
            console.log(res)
        }
        else if(!this.check_movers_enough())
        {
            console.log("Spawning a mover for the mine corp" + name)
            var recipe =
            {
                name: "drill",
                body: [Game.CARRY, Game.CARRY, Game.MOVE, Game.MOVE],
                memory: 
                {
                    role: "drill",
                    occupation: name
                },
            }
            
            var res = room.enqueue(recipe, this.event(this.on_spawned_mover))
        }
    }
}

function getCorpForMine(mine, center)
{
    if(mine.memory.corp)
    {
        var corp = Corporations[mine.memory.corp]
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