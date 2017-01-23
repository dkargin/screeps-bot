
var ROLE_EXPEDITION = "expedition"
var SUBROLE_CLAIMER = "claimer"

init_claimer = function(creep_memory)
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
        var info
        if(!(room_name in Memory.expedition))
        {
            info = { creep: "", hostile : false, owned: false}
            Memory.expedition[room_name] = info
        }
        else
            info = Memory.expedition[room_name]
        
        if(room_name in Game.rooms && Game.rooms[room_name].controller.my)
            info.owned = true

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
            if(!('claimer' in info) && !info.owned)
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
            var target = this.find_target(creep)
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
            if(creep.memory.target == 'W8N2')
                creep.memory.target = 0
            if(creep.room.name == creep.memory.target)
            {
                if(!creep.memory.entered)
                {
                    //creep.moveto(new RoomPosition(25,25, creep.room.target))
                    creep.moveTo(25,25)
                    creep.memory.entered = 1
                }
                console.log("CLAIMer arrived to a target room "+creep.memory.target + " creep.room="+creep.room)
                var controller = creep.room.controller
                console.log("Found controller = " + controller + " pos=", controller.pos)


                var res = creep.claimController(creep.room.controller)
                if( res != OK){
                    creep.moveTo(creep.room.controller)
                    console.log("Controller is too far, err="+res)
                }
                /*
                var target = creep.pos.findClosestByPath(STRUCTURE_CONTROLLER)
                if(target)
                {
                    if(creep.claimController(creep.memory.target) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target);
                    }
                }*/
                //
            }
            else
            {
                var exits = creep.room.findExitTo(creep.memory.target)
                var exit = creep.pos.findClosestByPath(exits);
                creep.moveTo(exit);
                //creep.moveTo(creep.memory.target)
            }
        }
	}
}

module.exports = new Expedition();