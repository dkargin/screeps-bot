/// Unpacks recipe from compact definition
unpack_recipe = function(packed_recipe)
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

pack_recipe = function(recipe)
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

print_bp_costs = function()
{
    for(var body in BODYPART_COST)
    {
        console.log("Part="+body+" cost="+BODYPART_COST[body])
    }
}

/// Get recipe cost for packed blueprint
get_recipe_cost = function(packed_bp)
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

generate_simple_recipe = function(bp, max_cost)
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

make_simple_generator = function(name, bp)
{
    console.log("Making simple blueprint generator for type="+name)
    return function(cost)
    {
        return generate_simple_recipe(bp, cost)  
    };
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
        this.name = name
        this.generator = generator
        this.initializer = initializer
        
        if(!Memory.recipe_info[name])
        {
            Memory.recipe_info[name] = {}
        }
        
        var info = Memory.recipe_info[name]
        
        info.population = []
        info.priority = 1
        info.required = 0
        info.last_created = 0
    }

    get_info()
    {
        return Memory.recipe_info[this.name]
    }

    get_population()
    {
        return this.get_info().population
    }

    /// Get index of last created creep
    get_last_created()
    {
        return this.get_info().last_created
    }

    /// Called by HoP when creep is created
    creep_created(uid, desc)
    {
        var info = this.get_info()
        var creep = Game.creeps[uid]
        creep.memory.recipe = this.name
        creep.memory.recipe_rev = desc.name
        info.last_created ++
        info.population.push(uid)
    }

    /// Generates best recipe available for specified room
    /// @returns dictionary with fields: {name, blueprint, unique_name}
    ///  - name - blueprint name
    ///  - blueprint - body description
    ///  - unique_name - unique name for a creep
    get_best_recipe(room, blueprint)
    {
        
        var helper = this.helpers[blueprint]
        if(!helper)
        {
            console.log("Picking best recipe for blueprint"+blueprint+" .. no such blueprint")
            return "norecipe", []
        }
        var info = this.get_info()
        //console.log("Picking best recipe for blueprint="+blueprint)
        var cost_limit = room.energyCapacityAvailable
        var result = helper.generator(cost_limit)
        result['unique_name'] = result.name + "#" + (info.last_created+1)
        
        return result 
    }

    /// Check recipe population
    check_population()
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
        }
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

        Spawn.prototype.pop_queue = function()
        {
            this.room.memory.spawn_queue.pop()
            console.log(this.room.memory.spawn_queue)
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

    /// Enqueue recipe
    /// @param room - selected room
    /// @param recipe - recipe name
    enqueue(room, recipe)
    {
        console.log("Adding recipe "+recipe+" to room "+ room.name)
        var spawn_queue = room.memory.spawn_queue
        if(spawn_queue.length < this.max_length)
        {
            spawn_queue.push(recipe)
            return true
        }
        return false
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
        
        /// Check if spawn queue is empty
        if(room.memory.spawn_queue.length == 0)
        {
            console.log("Spawn queue for room" + room.name + " is empty")
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
        
        return helper.generator(room.energyCapacityAvailable) 
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
            //console.log("Not enough energy for "+name)
            break;
        case ERR_NAME_EXISTS:
            console.log("Name "+ new_name + " already exists")
            break
        case ERR_INVALID_ARGS:
            console.log("Invalid recipe body " + name)
            break
        }

        if(test_result == OK)
        {
            var result = spawn.createCreep(desc.blueprint, desc.unique_name)
            if(_.isString(result)) 
            {   
                /// Really created a creep
                var creep = Game.creeps[result]
                helper.initializer(creep)
                helper.creep_created(creep, desc)
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