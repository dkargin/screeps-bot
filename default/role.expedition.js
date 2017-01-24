
var ROLE_EXPEDITION = "expedition"
var SUBROLE_CLAIMER = "claimer"

var init_claimer = function(creep_memory)
{
    console.log("Initializing upgrader system for")
    creep_memory.role = ROLE_EXPEDITION
}

class Expedition
{
    constructor() 
    {
        this.claimers = 0
        this.role = ROLE_EXPEDITION
        /// Maps room name to expedition info
        Memory.expedition = Memory.expedition || {}
        for(var room in Game.rooms)
        {
            this.check_surroundings(room)
        }
    }
    
    init_recipes(HoP)
    {
        // Recipes for heavy drill
        //
        var recipes_claimer = {
            claimer_mk1: {claim:1, move:2},                                  // 700
        }
        HoP.memorize_recipe_simple(SUBROLE_CLAIMER, recipes_claimer, init_claimer)
    }

    get_info(room_name)
    {
        if(!(room_name in Memory.expedition))
            Memory.expedition[room_name] = { creep: "", hostile : false}
        return Memory.expedition[room_name]
    }
    /// @param {Room} room)
    check_surroundings(room)
    {
        console.log("Checking surroundings for room="+room)
        var exits = Game.map.describeExits(room)
        for(var e in exits)
        {
            var exit = exits[e] // adjacent room name
            var info = this.get_info(exit)
            var available = Game.map.isRoomAvailable(exit)
            console.log("Adjacent room " + exit + " available="+available)
        }
    }
    
    start_turn()
    {
        this.claimers = 0
    }
    
    check_spawn(spawn)
    {
        //console.log("Checking upgraders: " + this.upgraders)
        
        if(spawn.population_available(SUBROLE_CLAIMER) == 0)
        {
            spawn.room.enqueue(SUBROLE_CLAIMER)
        }
    }

    /// Finds a room to conquer
    find_target(creep)
    {
        for(var r in Memory.expedition)
        {
            var info = Memory.expedition[r]
            if(!('claimer' in info) )
            {
                info.claimer = creep.id
                console.log("Creep "+ creep.id + " is going to claim room "+r)
                return r
            }
        }
    }
    
    /** @param {Creep} creep **/
    run(creep) {
        this.claimers++;

        if(!creep.memory.target)
        {
            var target = this.find_target()
            if(target)
            {
                creep.memory.target = target   
            }
            else
            {
                console.log("No CLAIM target is available")
            }
        }

        if(creep.memory.target)
        {
            if(creep.room.name == creep.memory.target)
            {
                console.log("CLAIMer arrived to a target room")
                //creep.room.find()
            }
            else
            {
                creep.moveTo(room)
            }
        }
	}
}

module.exports = new Expedition();