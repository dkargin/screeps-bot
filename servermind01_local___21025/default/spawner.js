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
        print("Part="+body+" cost="+BODYPART_COST[body])
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
        console.log("Part="+part+" cost="+part_cost+" count="+part_count)
        cost = cost + part_cost*part_count; 
    }
    return cost
}

generate_simple_recipe = function(bp, max_cost)
{
    console.log("Running simple recipe generator, max_cost="+max_cost)
 // spawn.getM
    var recipes = bp
    var best
    var name
    
    for(var i in recipes)
    {
        var cost = get_recipe_cost(recipes[i])
        console.log("Checking recipe name="+i+" cost="+cost+" bpu="+unpack_recipe(recipes[i]))
        if(max_cost >= cost)
        {
            best = recipes[i]
            name = i
        }
    }
    
    console.log("Best="+best+" cost = " + get_recipe_cost(recipes[i]))
    return name, best   
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
        
        var controller = this
        
        Room.prototype.enqueue = function(recipe)
        {
            controller.enqueue(this, recipe)
        }
        
        Room.prototype.memorize_recipe = function(recipe, generator)
        {
            controller.addRecipe(recipe, generator)
        }
        
        Room.prototype.print_queue = function()
        {
            console.log(this.memory.spawn_queue)
        }
        
        Room.prototype.get_recipe = function(recipe)
        {
            return controller.get_best_recipe(this, recipe)
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
        console.log("Adding recipe "+recipe+" to room "+ this.name)
        spawn_queue = room.memory.spawn_queue
        if(spawn_queue.length < this.max_length)
            spawn_queue.push(recipe)
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
            return;
            
        for(var i in room.spawns)
        {
            process_spawn(room.spawns[i])
        }
    }
    
    
    get_best_recipe(room, blueprint)
    {
        
        var helper = this.helpers[blueprint]
        if(!helper)
        {
            console.log("Picking best recipe for blueprint"+blueprint+" .. no such blueprint")
            return "norecipe", []
        }
        console.log("Picking best recipe for blueprint="+blueprint)
        var cost_limit = room.energyCapacityAvailable
        var local_name, bp_packed = helper.generator(cost_limit)
        
        blueprint = unpack_recipe(bp_packed)
        return local_name, blueprint
    }
    
    /// Run spawner updating process
    process_spawn(spawn, room)
    {
        if(!spawn.spawning)
        {
            var name = room.memory.spawn_queue[0]
            var design_name, blueprint = this.get_best_recipe(room, name)
            console.log("Trying to spawn design="+name+" rev_name="+design_name+" data=" + blueprint)
            /*
            var result = spawn.createCreep(recipe, "Harvester #"+new_id, {role: 'harvester'})
            if(result == OK)
            {
                Memory.last_harvester++;
                console.log("Created harvester: "+recipe)
            }
            if(result == -3)
            {
                Memory.last_harvester++;
            }
            else
            {
                console.log("Failed to build harvester " + recipe + ":" + result)
                
            }*/
        }
    }
}

module.exports = new HoP();