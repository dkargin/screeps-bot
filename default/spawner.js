// Spawner seems to be OK for now. It works

/// Unpacks recipe from compact definition
global.unpack_recipe = function(packed_recipe)
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
global.pack_recipe = function(recipe)
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
global.get_recipe_cost = function(packed_bp)
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

/// `Head of personnel` manager class (yup ss13)
///  - Keeps creep spawn queue for specified spawn
///  - Checks current population for each recipe and spawns additional creeps if needed

/// Enqueue recipe
/// @param room - selected room
/// @param recipe - recipe name    
Room.prototype.enqueue = function(desc, handler)
{
    /** Recipe example
    var recipe =
    {
        name: "drill",
        body: [Game.CARRY, Game.CARRY, Game.MOVE, Game.MOVE],
        memory: 
        {
            role: "drill",
            occupation: name
        },
    }**/

    console.log("Adding recipe "+desc.name+" to room "+ this.name)
    var spawn_queue = this.memory.spawn_queue
    
    this.memory.spawn_queue = this.memory.spawn_queue || []

    if(this.memory.spawn_queue.length >= 5)
    {
    	return
    }
    
    var action = new Actions.Spawn(desc, handler)
    return Actions.taskqueue_add(this, action)
}

Spawn.prototype.enqueue = function(recipe)
{
    return controller.enqueue(this.room, recipe)
}

Room.prototype.print_queue = function()
{
    console.log(this.memory.spawn_queue)
}

Spawn.prototype.print_queue = function()
{
    console.log(this.room.memory.spawn_queue)
}

Spawn.prototype.new_name = function(base)
{
	return base + "#" + Memory.last_object_id
}

Spawn.prototype.next_name = function()
{
	Memory.last_object_id++
}


/// This class is singleton-like. Only one instance should exist
class HoP
{
    constructor()
    {
        this.helpers = {}   // dictionary of recipe helpers
        this.queue = []     // current production queue
        this.max_length = 5 // max queue length
        
        Memory.last_object_id = 0

        if(!('recipe_info' in Memory))
        {
            Memory.recipe_info = {}
        }
        
        for(var s in Game.spawns)
        {
            var room = Game.spawns[s].room
            room.memory.spawn_queue = room.memory.spawn_queue || []
        }
        
        var controller = this

        Spawn.prototype.population = function(recipe)
        {
            return controller.population(recipe)
        }
        
        Room.prototype.memorize_recipe = function(recipe, generator)
        {
            controller.addRecipe(recipe, generator)
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
        
        var name = desc.name
        var desc = room.memory.spawn_queue[0]
        var unique_name = desc.name + "#" + (Memory.last_object_id+1)
        console.log("Trying to spawn design="+desc.name+" rev_name="+unique_name+" data=" + desc.body)
        var test_result = spawn.canCreateCreep(desc.body, desc.unique_name)

        switch(test_result)
        {
        case OK:
            console.log("Can create new "+name)
            break;
        case ERR_NOT_ENOUGH_ENERGY:
            console.log("Not enough energy for "+name)
            break;
        case ERR_NAME_EXISTS:
            console.log("Name "+ unique_name + " already exists")
            helper.add_name(unique_name)
            break
        case ERR_INVALID_ARGS:
            console.log("Invalid recipe body " + name)
            break
        }

        if(test_result == OK)
        {
            console.log("Spawning design="+name+" rev_name="+unique_name+" data=" + desc.body)
            var memory = 
            {
                recipe:name,
                recipe_rev:desc.name
            }
            helper.initializer(memory)
            var result = spawn.createCreep(desc.body, unique_name, desc.memory)
            if(_.isString(result)) 
            {   
                console.log("Spawned design="+name+" rev_name="+unique_name+" data=" + desc.body)
                /// Really created a creep
                var creep = Game.creeps[result]
                /// TODO: event it!
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