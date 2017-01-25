var Actions = require('utils.action')

/// Unpacks recipe from compact definition
var unpack_recipe = function(packed_recipe)
{
    var result = []
    for(var t in packed_recipe)
    {
        var n = packed_recipe[t]
        //console.log("Part "+t+"x"+n)
        for(var i = 0; i < n; i++)
        {
            result.push(t)
        }
    }
    return result
}

/// Takes recipe in form [work, work, carry, move] and returns in form {work:2, carry:1, move:1}
var pack_recipe = function(recipe)
{
    var packed = {}
    for(var i in recipe)
    {
        var part = recipe[i]
        if(!(part in packed))
            packed[part] = 1
        else
            packed[part] ++
    }
    return packed
}

var print_bp_costs = function()
{
    for(var body in BODYPART_COST)
    {
        console.log("Part="+body+" cost="+BODYPART_COST[body])
    }
}

/// Get recipe cost for packed blueprint
var get_recipe_cost = function(packed_bp)
{
    var cost = 0
    for(var part in packed_bp)
    {
        var part_cost = BODYPART_COST[part]
        var part_count = packed_bp[part]
        //console.log("Part="+part+" cost="+part_cost+" count="+part_count)
        cost = cost + part_cost*part_count; 
    }
    return parseInt(cost)
}

var generate_simple_recipe = function(bp, max_cost)
{
    max_cost = parseInt(max_cost, 10)
    //console.log("Running simple recipe generator, max_cost="+max_cost)
    
    //print_bp_costs()
    //spawn.getM
    var recipes = bp
    var best
    var name
    
    for(var i in recipes)
    {
        var c = parseInt(get_recipe_cost(recipes[i]))
        if(max_cost < c)
        {
            //console.log("Stopped checking at"+c)
            break;
        }
        else
        {
            //console.log("Improving recipe="+i+" cost="+c+" bpu="+unpack_recipe(recipes[i]))
            best = recipes[i]
            name = i
        }
    }
    
    //console.log("generate_simple_recipe best="+best+" cost = " + get_recipe_cost(best) + "max=" + max_cost)
    return { name:name, blueprint:unpack_recipe(best) }
}

var make_simple_generator = function(name, bp)
{
    //console.log("Making simple blueprint generator for type="+name)
    return function(cost)
    {
        return generate_simple_recipe(bp, cost)  
    };
}

Creep.prototype.recycle = function()
{
    //this.pos.
    var targets = this.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return structure.structureType == STRUCTURE_SPAWN
        }   
    });
    if(targets.length > 0)
    {
        if(targets[0].recycleCreep(this) == ERR_NOT_IN_RANGE)
        {
            this.moveTo(targets[0])
        }
    }
}

Room.prototype.mass_suicide = function()
{

}

Spawn.prototype.clear_flags = function()
{
    this.room.clear_flags()
}

/// Wraps up recipe call
/// We need to keep:
///  - total recipe population
///  - required population
class RecipeHelper
{
    // @param name - generic recipe name
    // @param generator - generates blueprint and active name
    // @param initializer - function is called when creep is going to be spawned
    constructor(name, generator, initializer)
    {
        Actions.test_fn()
        this.name = name
        this.generator = generator
        this.initializer = initializer
        
        var info
        if(!Memory.recipe_info[name])
        {
            Memory.recipe_info[name] = {}
            info = Memory.recipe_info[name]
            info.population = []
            info.population.free_index = []
            info.priority = 1
            info.required = 0
            info.last_created = 0
        }
        if(!Memory.recipe_info[name].enqueued)
            Memory.recipe_info[name].enqueued = 0

        if(!Memory.recipe_info[name].free_index)
            Memory.recipe_info[name].free_index = []
    }

    get_info()
    {
        return Memory.recipe_info[this.name]
    }

    get_population()
    {
        return this.get_info().population.length
    }

    get_enqueued()
    {
        return this.get_info().enqueued
    }

    /// Get index of last created creep
    get_last_created()
    {
        return this.get_info().last_created
    }

    /// Called by HoP when creep is created
    creep_created(room, uid, desc)
    {
        console.log("Initializing creep data for "+uid)
        var info = this.get_info()
        //var creep = Game.creeps[uid]

        //if(!desc.reused_index)
        //    info.last_created ++
        //creep_memory.index = info.last_created
        info.population.push(uid)

        info.enqueued--
        if(info.enqueued < 0)
        {
            console.log("Error: enqued counter became zero")
            info.enqueued = 0
        }
        //this.initializer(creep_memory)
    }

    /// Generates best recipe available for specified cost limit
    /// @returns dictionary with fields: {name, blueprint, unique_name}
    ///  - name - blueprint name
    ///  - blueprint - body description
    ///  - unique_name - unique name for a creep
    get_best_recipe(cost_limit)
    {
        //console.log("Picking best recipe for blueprint="+this.name)
        var info = this.get_info()
        var result = this.generator(cost_limit)
        var new_index = info.last_created+1

        result.reused_index = false

        if(info.free_index.length > 0)
        {
            new_index = info.free_index.pop()
            result.reused_index = true
        }

        result.unique_name = result.name + "#" + (info.last_created+1)

        return result 
    }

    on_popped(room)
    {
        var info = this.get_info()

        info.enqueued--
        if(info.enqueued < 0)
        {
            console.log("Error: enqued counter became zero")
            info.enqueued = 0
        }
    }

    /// Check recipe population
    check_population(queue)
    {
        var info = this.get_info()
        var dead = []
        var alive = []
        /// Check alive creeps
        for(var i in info.population)
        {
            var name = info.population[i]
            if(!Game.creeps[name])
            {
                dead.push(name)
            }
            else
            {
                alive.push(name)
            }
        }

        info.population = alive

        if(dead.length > 0)
        {
            console.log("Found dead creeps:" + dead)
            for(var i in dead)
            {
                info.free_index.push(dead[i])
            }
        }
    }

    /// Add creep name to population
    /// Used in case of name collision
    add_name(name)
    {
        var info = this.get_info()
        info.population.push(name)
        info.last_created++
    }
}


/// `Head of personnel` manager class (yup ss13)
///  - Keeps creep spawn queue for specified spawn
///  - Checks current population for each recipe and spawns additional creeps if needed

/// This class is singleton-like. Only one instance should exist
class HoP
{
    constructor()
    {
        this.helpers = {}   // dictionary of recipe helpers
        this.queue = []     // current production queue
        this.max_length = 5 // max queue length

        if(!('recipe_info' in Memory))
        {
            Memory.recipe_info = {}
        }
        
        for(var s in Game.spawns)
        {
            var room = Game.spawns[s].room
            
            if(!room.memory.spawn_queue)
            {
                room.memory.spawn_queue = []
            }
        }
        
        var controller = this
        
        Room.prototype.enqueue = function(recipe)
        {
            return controller.enqueue(this, recipe)
        }

        Spawn.prototype.enqueue = function(recipe)
        {
            return controller.enqueue(this.room, recipe)
        }

        Spawn.prototype.population = function(recipe)
        {
            return controller.population(recipe)
        }
        
        Room.prototype.memorize_recipe = function(recipe, generator)
        {
            controller.addRecipe(recipe, generator)
        }
        
        Room.prototype.print_queue = function()
        {
            console.log(this.memory.spawn_queue)
        }

        Spawn.prototype.print_queue = function()
        {
            console.log(this.room.memory.spawn_queue)
        }

        Room.prototype.population_available = function(recipe)
        {
            return controller.population_available(recipe)
        }

        Spawn.prototype.population_available = function(recipe)
        {
            return controller.population_available(recipe)
        }

        Spawn.prototype.pop_queue = function()
        {
            return controller.pop_queue(this.room)
        }

        Spawn.prototype.clear_queue = function()
        {
            return controller.clear_queue(this.room)
        }
        
        Room.prototype.get_recipe = function(recipe)
        {
            return controller.get_best_recipe_desc(this, recipe)
        }
    }

    /// Add recipe to a local storage
    /// @param name - generic recipe name
    /// @generator - generator function, that creates blueprint for specified cost limit
    memorize_recipe(name, generator, initializer)
    {
        var helper = new RecipeHelper(name, generator, initializer)
        this.helpers[name] = helper
    }
    
    memorize_recipe_simple(name, blueprint_set, initializer)
    {
        var generator = make_simple_generator(name, blueprint_set)
        var helper = new RecipeHelper(name, generator, initializer)
        this.helpers[name] = helper
    }

    /// Get queue length
    getLength(spawn)
    {
        if (source.memory && source.memory.queue)
            return source.memory.queue.length
    }

    population(recipe)
    {
        if(!this.helpers[recipe])
            return 0
        var helper = this.helpers[recipe]

        return helper.get_population()
    }

    population_available(recipe)
    {
        if(!this.helpers[recipe])
            return 0
        var helper = this.helpers[recipe]

        return helper.get_population() + helper.get_enqueued()
    }

    /// Enqueue recipe
    /// @param room - selected room
    /// @param recipe - recipe name
    enqueue(room, recipe)
    {
        var helper = this.helpers[recipe]
        if(!helper)
        {
            console.log("ERROR: No recipe helper for "+name)
        }

        console.log("Adding recipe "+recipe+" to room "+ room.name)
        var spawn_queue = room.memory.spawn_queue
        
        if(!room.memory.spawn_queue)
            room.memory.spawn_queue = []

        if(spawn_queue.length < this.max_length)
        {
            spawn_queue.push(recipe)
            helper.get_info().enqueued++
            return true
        }
        return false
    }

    pop_queue(room)
    {
        var recipe = room.memory.spawn_queue.pop()
        var helper = this.helpers[recipe]
        if(helper)
        {
            helper.on_popped(room)
        }
        console.log("Remaining queue" + room.memory.spawn_queue)
    }

    clear_queue(room)
    {
        while(room.memory.spawn_queue.length > 0)
            this.pop_queue(room)
    }

    /// Update required population for specified recipe
    /// @param room - selected room
    /// @param recipe - recipe name
    /// @param total - desired population for the recipe
    update_needs(room, recipe, total, priority)
    {

    }
    
    /// Process spawning 
    administer_room(room)
    {
        if(!room.memory.spawn_queue)
        {
            room.memory.spawn_queue = []
        }
        
        for(var h in this.helpers)
        {
            this.helpers[h].check_population(room.memory.spawn_queue)
        }
        /// Check if spawn queue is empty
        if(room.memory.spawn_queue.length == 0)
        {
            //console.log("Spawn queue for room" + room.name + " is empty")
            return;
        }
        
        for(var i in Game.spawns)
        {
            this.process_spawn(Game.spawns[i], Game.spawns[i].room)
        }
    }
    
    /// Get best recipe descriptor
    get_best_recipe_desc(room, blueprint)
    {
        
        var helper = this.helpers[blueprint]
        if(!helper)
        {
            console.log("Picking best recipe for blueprint"+blueprint+" .. no such blueprint")
            return
        }
        //console.log("Picking best recipe for blueprint="+blueprint)
        
        return helper.get_best_recipe(room.energyCapacityAvailable) 
    }
    
    /// Run spawner updating process
    process_spawn(spawn, room)
    {
        if(spawn.spawning)
            return
        
        var name = room.memory.spawn_queue[0]

        var helper = this.helpers[name]

        if (!helper)
        {
            console.log("Invalid bp name in production queue: " + name)
            room.memory.spawn_queue.pop()
            return
        }

        var desc = this.get_best_recipe_desc(room, name)

        if(!desc)
        {
            room.memory.spawn_queue.pop()
            return
        }

        
        //console.log("Trying to spawn design="+name+" rev_name="+desc.unique_name+" data=" + desc.blueprint)
        var test_result = spawn.canCreateCreep(desc.blueprint, desc.unique_name)

        switch(test_result)
        {
        case OK:
            console.log("Can create new "+name)
            break;
        case ERR_NOT_ENOUGH_ENERGY:
            console.log("Not enough energy for "+name)
            break;
        case ERR_NAME_EXISTS:
            console.log("Name "+ desc.unique_name + " already exists")
            helper.add_name(desc.unique_name)
            break
        case ERR_INVALID_ARGS:
            console.log("Invalid recipe body " + name)
            break
        }

        if(test_result == OK)
        {
            console.log("Spawning design="+name+" rev_name="+desc.unique_name+" data=" + desc.blueprint)
            var memory = 
            {
                recipe:name,
                recipe_rev:desc.name
            }
            helper.initializer(memory)
            var result = spawn.createCreep(desc.blueprint, desc.unique_name, memory)
            if(_.isString(result)) 
            {   
                console.log("Spawned design="+name+" rev_name="+desc.unique_name+" data=" + desc.blueprint)
                /// Really created a creep
                var creep = Game.creeps[result]
                //helper.initializer(creep)
                helper.creep_created(room, creep, desc)
                room.memory.spawn_queue.pop()
            }
            else
            {
                console.log("Failed to spawn for some reason")
            }
        }
    }
}

module.exports = new HoP();