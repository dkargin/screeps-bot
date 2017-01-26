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

class Corp extends Actions.EventHandler
{
    constructor()
    {
        super()
        
        Corporations[this.name()] = this
    }
    /// @param objects - array of object ids
    /// @returns array of objects that are still alive
    check_alive(objects)
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
}

Object.defineProperty(Corp.prototype, 'memory', {
    get: function() {
        if(_.isUndefined(Memory.corporations)) {
            Memory.corporations = {};
        }
        if(!_.isObject(Memory.corporations)) {
            return undefined;
        }
        return Memory.corporations[this.name()] = Memory.corporations[this.name()] || {};
    },
    set: function(value) {
        if(_.isUndefined(Memory.corporations)) {
            Memory.corporations = {};
        }
        if(!_.isObject(Memory.corporations)) {
            throw new Error('Could not set source memory');
        }
        Memory.corporations[this.name()] = value;
    }
});

/// Mining corporation
/** 
 * Mining corporation consists of:
 * - miner
 * - storage nearby the mine
**/
class MineCorp extends Corp
{
    constructor(mine_id, unload_obj)
    {
        super()
        
        this.memory.mine_id = mine_id
        
        
        
        this.memory.unload_obj = unload_obj
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
        
        this.check_path()
    }
    
    check_path()
    {
        var path_to = this.memory.path_to
        if(!path_to)
        {
            
        }
    }
    
    name()
    {
        return "MineCorp" + this.memory.mine_id
    }
    
    has_storage()
    {
        return false
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
        Game.getObjectById(this.memory.mine_id)
    }
    
    /// Get room
    get_room()
    {
        return get_mine().room
    }
    
    /// Get dat drill
    get_drill()
    {
        return Game.getObjectById(this.memory.drill)
    }
    
    /// Check if personnel is alive. Remove personal that is dead
    check_personnel()
    {
        this.memory.movers = this.check_alive(this.memory.movers)
        this.memory.workers = this.check_alive(this.memory.movers)
    }
    
    /// Calculates mover performance
    calculate_mover_performance(ncarry, nmove)
    {
        
    }
    
    check_movers_enough()
    {
        
    }
    
    update()
    {
        console.log("Corporation " + this.name + " is working hard")
        this.check_personnel()
        var room = this.get_room()
        if(!this.memory.drill)
        {
            console.log("Spawning a drill for the mine corp" + name())
            var recipe =
            {
                name: "drill",
                memory: 
                {
                    role: "drill",
                    occupation: this.name()
                },
            }
            var res = room.spawn(recipe, Actions.registerEvent())
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
            
    
        if(!('storage' in mine.memory))
            mine.memory.storage = 0

        if(!('build_storage' in mine.memory))
            mine.memory.build_storage = 0


        var storage_sites = mine.pos.findInRange(FIND_STRUCTURES, 2, 
        {
            filter: { structureType: STRUCTURE_CONTAINER }
        });

        for(var s in storage_sites)
        {
            storage_sites[s].memory = storage_sites[s].memory || {}
            storage_sites[s].memory.type = "source"                
        }

        console.log("Found "+storage_sites.length + " storage sites near mine " + mine.id)

        var storage_build_sites = mine.pos.findInRange(FIND_CONSTRUCTION_SITES, 2, 
        {
            filter: { structureType: STRUCTURE_CONTAINER }
        });
        console.log("Found "+storage_build_sites.length + " storage build sites near mine " + mine.id)
        
       
        var path = pos.findPathTo(mine.pos)
        var distance = path.length
        
        var spots = []
        var max = 0
        var storage_pos
        
        if(path)
        {
            var finish = path[path.length-2];
            storage_pos = new RoomPosition(finish.x, finish.y, pos.roomName)
            
            /*
            for(var x = mine.pos.x-1; x <= mine.pos.x+1; x++)
                for(var y = mine.pos.y-1; y <= mine.pos.y+1; y++)
                {
                    if(x == mine.pos.x && y == mine.pos.y)
                        continue;
                    var spot_pos = new RoomPosition(x,y, mine.pos.roomName)
                    var tile = Game.map.getTerrainAt(spot_pos)

                    if(tile != 'wall')
                    {
                        spots.push(spot_pos)
                        var res = mine.room.createFlag(spot_pos, "Minespot_"+x+":"+y)
                        if(res == ERR_NAME_EXISTS)
                        {
                            
                        }
                        else
                        {
                            console.log("Created mine spot flag")
                        }
                    }
                }*/
            max = spots.length
        }
        
        var info = 
        {
            distance : distance,
            max : max,
            miners : [],
            movers : [],
            storage_pos : storage_pos,
        }   
        
        mine.memory = _.merge(mine.memory, info)
        
    }
    
    var total_harvesters = 0
    for(var i in Memory.mine_info)
    {
        var info = Memory.mine_info[i]
        var harvesters_per_mine = info.max + Math.round(info.distance / 4);
        //console.log("Mine "+i+" needs "+harvesters_per_mine+" harvesters")
        total_harvesters = total_harvesters+ 1 //harvesters_per_mine
    }

    Memory.need_harvesters = total_harvesters //Memory.mine_info.length
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
        
    }
};